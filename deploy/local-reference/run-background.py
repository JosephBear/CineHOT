"""Local CineHOT supervisor; detached by start-background.py."""
from pathlib import Path
from datetime import datetime, timezone
import fcntl, json, os, signal, subprocess, time
work=Path(__file__).resolve().parent
root=Path('/Volumes/AI/Cinema-hot/cinema-hot')
node='/Users/josephus/.workbuddy-ai/binaries/node/versions/v24.21.0-darwin-arm64/bin/node'
lock=(work/'background.lock').open('a')
try: fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError: raise SystemExit(0)
env={**os.environ,'PATH':str(work/'postgres17/bin')+':'+str(Path(node).parent)+':'+os.environ.get('PATH',''),'FEISHU_CONTENT_PUSH_ENABLED':'false','FEISHU_INTERNAL_ENABLED':'false','INDEXNOW_SUBMIT_ENABLED':'false','API_HOST':'127.0.0.1','WEB_HOST':'127.0.0.1'}
env.pop('COLLECT_ENABLED',None); env.pop('MODEL_CALLS_ENABLED',None)
children={}; logs={}; retry={}; running=True
scripts={'api':'apps/api/src/main.ts','web':'apps/web/server.ts','worker':'apps/worker/src/main.ts'}
def note(message): print(datetime.now(timezone.utc).isoformat(),message,flush=True)
def stop(signum, frame):
 global running
 note(f'stop signal={signum}'); running=False
signal.signal(signal.SIGTERM,stop); signal.signal(signal.SIGINT,stop)
try:
 while running:
  for name,script in scripts.items():
   child=children.get(name)
   if child is not None and child.poll() is not None:
    note(f'{name} exited code={child.returncode}; restart in 30 seconds')
    logs.pop(name).close(); children.pop(name); retry[name]=time.monotonic()+30
   if name not in children and time.monotonic()>=retry.get(name,0):
    logs[name]=(work/f'local-{name}.log').open('a')
    children[name]=subprocess.Popen([node,'--env-file=.env',script],cwd=root,env=env,stdin=subprocess.DEVNULL,stdout=logs[name],stderr=subprocess.STDOUT)
    note(f'{name} started pid={children[name].pid}')
  status={'pid':os.getpid(),'observed_at':datetime.now(timezone.utc).isoformat(),'children':{n:p.pid for n,p in children.items()}}
  temporary=work/'background-status.tmp'; temporary.write_text(json.dumps(status)); temporary.replace(work/'background-status.json')
  time.sleep(2)
finally:
 for name in ['worker','web','api']:
  p=children.get(name)
  if p and p.poll() is None:
   p.terminate()
   try:p.wait(timeout=210 if name=='worker' else 15)
   except subprocess.TimeoutExpired:p.kill();p.wait()
 for f in logs.values(): f.close()
 note('supervisor stopped')
