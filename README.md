# Visionaries Explorer

## Deployment

1. Make sure `ansible` is installed
2. Make sure `.env` looks something like this:

```
STAGING_PATH=/srv/www/XXXX
PRODUCTION_PATH=/srv/www/XXXX
```

3. Make sure `hosts` has something like this:

```
[production]
my.production.domain ansible_user=[user] ansible_ssh_private_key_file=~/.ssh/[ssh_key].pem

[staging]
my.stagin.domain ansible_user=[user] ansible_ssh_private_key_file=~/.ssh/[ssh_key].pem
```

4. Run this to deploy!:

```
# Staging
$ npm run deploy-staging

# Production
$ npm run deploy-production
```
