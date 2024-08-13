# Introduction

This is a backend application,
which is a pared-down version of [Jira](
  https://www.atlassian.com/software/jira
).

# How to set up the project locally

launch a terminal window and,
in it, start a process responsible for serving the application instance
by issuing the following command:

```bash
node server.js
```

launch another terminal window and,
in it, issue an HTTP request to the server:

```bash
curl -v \
  localhost:5000 \
  | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "message" : "hello world"
}
```
