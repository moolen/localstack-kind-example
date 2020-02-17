# LOCALSTACK EXAMPLE

This repository contains an example implementation using Locastack for local development and CI/CD.

The App simple reads from AWS SSM Parameter Store and creates a secret in kubernetes.

Documentation:
* [LocalStack](https://github.com/localstack/localstack)
* [awslocal](https://github.com/localstack/awscli-local)
* [kubernetes/kind](https://kind.sigs.k8s.io/docs/user/quick-start/)

## Use-Case: Local development

```sh
# start k8s cluster, localstack, app
$ minikube start
$ docker-compose up -d
$ source .localenv
$ npm install && node bin/app.js

# create params
$ AWS_DEFAULT_REGION=eu-central-1 awslocal ssm put-parameter --name "/param/foo" --value 1234 --type String
{
    "Version": 1
}

# check if k8s secret was created
$ kubectl get secret ssm-param-foo -o yaml
apiVersion: v1
data:
  value: MTIzNA==
kind: Secret
[...]

# check value
$ echo 'MTIzNA==' | base64 -d
1234

```

## Use-Case: CI/CD

This is what you run in your CI/CD environment.
```sh
$ ./e2e/run-e2e-suite.sh
```
Your CI/CD vendor must support docker

Example with travis:
```sh
sudo: false
services:
- docker

before_install:
# kubectl, kind
- curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && chmod +x kubectl && sudo mv kubectl /usr/local/bin/
- curl -Lo kind https://github.com/kubernetes-sigs/kind/releases/download/v0.7.0/kind-linux-amd64 && chmod +x kind && sudo mv kind /usr/local/bin/

script:
- ./e2e/run-e2e-suite.sh
```

## Acknowledgement
This is a stripped-down version of [godaddy/kubernetes-external-secrets](https://github.com/godaddy/kubernetes-external-secrets). I did contribute the e2e tests in [#207](https://github.com/godaddy/kubernetes-external-secrets/pull/207). The code is copied from there and was slightly modified. Same license applies (MIT).
