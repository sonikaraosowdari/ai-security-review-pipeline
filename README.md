# ai-security-review-pipeline

## Status

- [x] OWASP Juice Shop set up locally via Docker

## OWASP Juice Shop (Local Setup)

[OWASP Juice Shop](https://owasp.org/www-project-juice-shop/) is an intentionally
insecure web application used for security training, awareness demos, and
testing security tooling. It's running locally as the first step in this
project.

### How it was set up

```bash
docker pull bkimminich/juice-shop
docker run -d --name juice-shop -p 3000:3000 bkimminich/juice-shop
```

### Verifying it's running

```bash
docker ps --filter name=juice-shop
curl -I http://localhost:3000
```

The app is available at [http://localhost:3000](http://localhost:3000).

### Useful commands

```bash
docker stop juice-shop     # stop the container
docker start juice-shop    # restart it
docker rm -f juice-shop    # remove it
docker logs juice-shop     # view logs
```

## Next steps

- [ ] Define scope for AI-assisted security review
- [ ] Add tooling/scripts for automated scanning
- [ ] Document findings workflow
