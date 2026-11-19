#!/usr/bin/env python3
"""Upgrade the existing Compose project identified by its running API container."""
import argparse
import copy
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
import urllib.request
import uuid

import yaml


def run(*args, **kw):
    return subprocess.run(args, check=True, **kw)


def output(*args):
    return run(*args, stdout=subprocess.PIPE, text=True).stdout.strip()


def require(ok, message):
    if not ok:
        raise SystemExit(message)


def inspect(ref):
    return json.loads(output("docker", "inspect", ref))[0]


def mount(container, dest):
    hits = [m for m in container["Mounts"] if m["Destination"] == dest]
    require(len(hits) == 1 and hits[0]["Type"] in ("bind", "volume"),
            f"Expected exactly one persistent mount at {dest}")
    return hits[0]


def env(container):
    return dict(x.split("=", 1) for x in container["Config"]["Env"])


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def recovery(db, api, backup):
    """Take the offline file copy and restore both archives into disposable storage."""
    user = env(db)["POSTGRES_USER"]
    database = env(db)["POSTGRES_DB"]
    dbid, apiid = db["Id"], api["Id"]
    dump, files = backup / "database.dump", backup / "data.tar"
    with dump.open("xb") as stream:
        run("docker", "exec", dbid, "pg_dump", "-Fc", "-U", user, "-d", database, stdout=stream)
    # Inherit mounts by container ID: Docker cannot silently create a guessed source volume.
    helper = ["docker", "run", "--rm", "--network", "none", "--user", "0",
              "--volumes-from", apiid + ":ro", "--entrypoint", "tar", api["Image"]]
    with files.open("xb") as stream:
        run(*helper, "-cpf", "-", "-C", "/data", ".", stdout=stream)
    with files.open("rb") as stream:
        run(*helper[:2], "-i", *helper[2:], "-df", "-", "-C", "/data", stdin=stream)
    with files.open("rb") as stream:
        run("docker", "run", "--rm", "-i", "--network", "none", "--user", "0",
            "--entrypoint", "sh", api["Image"], "-ec",
            "mkdir /restore; cat > /archive; tar -xpf /archive -C /restore; tar -df /archive -C /restore", stdin=stream)

    scratch = output("docker", "run", "-d", "--network", "none",
                     "-e", "POSTGRES_HOST_AUTH_METHOD=trust", db["Image"])
    try:
        for _ in range(90):
            # The official image starts a temporary Unix-socket-only server during init.
            if subprocess.call(["docker", "exec", scratch, "pg_isready", "-h", "127.0.0.1"],
                               stdout=subprocess.DEVNULL) == 0:
                break
            time.sleep(1)
        else:
            raise SystemExit("Disposable PostgreSQL did not start")
        if user != "postgres":
            run("docker", "exec", scratch, "createuser", "-U", "postgres", user)
        run("docker", "exec", scratch, "createdb", "-U", "postgres", "-O", user, "restore_check")
        with dump.open("rb") as stream:
            run("docker", "exec", "-i", scratch, "pg_restore", "-U", "postgres",
                "--single-transaction", "--exit-on-error", "-d", "restore_check", stdin=stream)
        query = "select (select count(*) from articles), (select count(*) from publications), (select count(*) from schema_migrations)"
        def counts(cid, role, name):
            return output("docker", "exec", cid, "psql", "-XAt", "-v", "ON_ERROR_STOP=1", "-U", role, "-d", name, "-c", query)
        require(counts(dbid, user, database) == counts(scratch, "postgres", "restore_check"),
                "Restored row counts differ")
    finally:
        run("docker", "rm", "-fv", scratch, stdout=subprocess.DEVNULL)
    (backup / "SHA256SUMS").write_text("".join(f"{digest(p)}  {p.name}\n" for p in (dump, files)))


def candidate(base, image):
    # Insert explicit service images while preserving all other YAML, including anchors.
    text = base.read_text()
    root = yaml.compose(text)
    def fields(node):
        return {key.value: value for key, value in node.value}
    services = fields(fields(root)["services"])
    edits = []
    for name in ("web", "api", "worker"):
        node = services[name]
        image_node = fields(node).get("image")
        if image_node is not None:
            edits.append((image_node.start_mark.index, image_node.end_mark.index, json.dumps(image)))
        else:
            pos = node.start_mark
            edits.append((pos.index, pos.index, f"image: {json.dumps(image)}\n" + " " * pos.column))
    for start, end, replacement in sorted(edits, reverse=True):
        text = text[:start] + replacement + text[end:]
    return text


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api", required=True, help="Running API container name or ID")
    parser.add_argument("--image", required=True, help="Already pulled immutable release reference")
    args = parser.parse_args()
    os.umask(0o077)
    require(re.fullmatch(r"[\w./:-]+@sha256:[a-f0-9]{64}", args.image), "Use an image digest")
    target = json.loads(output("docker", "image", "inspect", args.image))[0]
    anchor = inspect(args.api)
    labels = anchor["Config"]["Labels"]
    require(labels.get("com.docker.compose.service") == "api", "Expected a Compose API")
    project = labels["com.docker.compose.project"]
    root = Path(labels["com.docker.compose.project.working_dir"])
    paths = [Path(p) for p in labels["com.docker.compose.project.config_files"].split(",")]
    base = paths[0]
    require(all(p.is_absolute() and p.is_file() and not p.is_symlink() for p in paths), "Missing or linked Compose file")
    lock = (root / ".cinehot-upgrade.lock").open("a")
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    def compose(*cmd, first=base):
        return ["docker", "compose", "--project-directory", str(root), "-p", project,
                *(s for p in (first, *paths[1:]) for s in ("-f", str(p))), *cmd]
    def config(first):
        return json.loads(output(*compose("config", "--format", "json", first=first)))
    original = config(base)
    live = {}
    for name in ("api", "web", "worker", "db"):
        cid = output(*compose("ps", "-q", name))
        require(bool(cid) and "\n" not in cid, f"Expected one running {name}")
        live[name] = inspect(cid)
        conf_hash = output(*compose("config", "--hash", name)).split()[-1]
        require(live[name]["Config"]["Labels"]["com.docker.compose.config-hash"] == conf_hash,
                f"{name} configuration drift: reconcile before upgrade")
    require(live["api"]["Id"] == anchor["Id"], "Wrong project")
    data = mount(anchor, "/data")
    require(data["Source"] == mount(live["worker"], "/data")["Source"], "API/worker data differs")
    pgdata = env(live["db"])["PGDATA"].rstrip("/")
    dbmounts = [m for m in live["db"]["Mounts"] if pgdata == m["Destination"] or pgdata.startswith(m["Destination"].rstrip("/") + "/")]
    require(len(dbmounts) == 1 and dbmounts[0]["Type"] in ("volume", "bind"), "Unexpected PGDATA mount")
    worker_env = env(live["worker"])
    for key in ("LLM_BASE_URL", "LLM_MODEL"):
        value = original["services"]["worker"]["environment"].get(key)
        require(value and value == worker_env.get(key), f"Check effective {key}")
    ports = live["web"]["NetworkSettings"]["Ports"].get("3000/tcp") or []
    require(len(ports) == 1 and ports[0]["HostIp"] == "127.0.0.1", "Expected loopback-only web")
    url = "http://127.0.0.1:" + ports[0]["HostPort"]
    def healthy():
        with urllib.request.urlopen(url + "/api/health", timeout=5) as r:
            health = json.load(r)
        return health.get("ok") is True and health.get("db") == "ok"
    require(healthy(), "Current site is not healthy")
    backup_root = root / "backups"
    backup_root.mkdir(exist_ok=True)
    backup = Path(tempfile.mkdtemp(prefix="oracle-", dir=backup_root))
    print(f"Backup: {backup}", flush=True)
    for i, p in enumerate(paths):
        shutil.copy2(p, backup / f"compose-{i}.yml")
    if (root / ".env").exists():
        shutil.copy2(root / ".env", backup / "env.backup")
    (backup / "inventory.json").write_text(json.dumps(dict(project=project, files=list(map(str, paths)),
        mounts=[data, dbmounts[0]], images={n:c["Image"] for n,c in live.items()}), indent=2))
    staged = base.with_name(".cinehot-" + uuid.uuid4().hex + ".yml")
    try:
        staged.write_text(candidate(base, args.image))
        expected = copy.deepcopy(original)
        for name in ("web", "api", "worker"):
            expected["services"][name]["image"] = args.image
        require(config(staged) == expected, "Candidate changes more than images, or an overlay overrides the image")
        run(*compose("stop", "-t", "515", "worker", "web", "api"))
        try:
            recovery(live["db"], anchor, backup)
        except BaseException:
            run(*compose("start", "api", "web", "worker"))
            raise
        (backup / "RESTORE_VERIFIED").touch()
        os.replace(staged, base)
        run(*compose("run", "--rm", "--no-deps", "api", "node", "scripts/migrate.ts"))
        run(*compose("run", "--rm", "--no-deps", "api", "node", "scripts/seed.ts"))
        run(*compose("up", "-d", "--no-deps", "api", "web"))
        for _ in range(60):
            try:
                if healthy():
                    break
            except (OSError, ValueError):
                pass
            time.sleep(1)
        else:
            raise SystemExit("New site not ready; worker remains stopped")
        with urllib.request.urlopen(url + "/all", timeout=20) as r:
            require(r.status == 200, "List unavailable")
        run(*compose("up", "-d", "--no-deps", "worker"))
        for name in ("api", "web", "worker"):
            c = inspect(output(*compose("ps", "-q", name)))
            require(c["State"]["Running"] and c["Image"] == target["Id"], f"Check {name}")
        print("UPGRADE_VERIFIED")
    finally:
        staged.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
