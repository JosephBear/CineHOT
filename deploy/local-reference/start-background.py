"""Launch without keeping the terminal alive; flock prevents duplicates."""
from pathlib import Path
import fcntl, subprocess, time
work=Path(__file__).resolve().parent
with (work/'background.lock').open('a') as lock:
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:
  print('电影动态后台已在运行。');raise SystemExit(0)
 fcntl.flock(lock,fcntl.LOCK_UN)
with (work/'background-supervisor.log').open('a') as log:
 subprocess.Popen(['/usr/bin/python3',str(work/'run-background.py')],cwd=work.parent,stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
time.sleep(3)
with (work/'background.lock').open('a') as lock:
 try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 except BlockingIOError:
  print('电影动态后台已启动；可以关闭这个终端窗口。网页：http://localhost:3000/all');raise SystemExit(0)
raise SystemExit('启动失败，请查看 work/background-supervisor.log')
