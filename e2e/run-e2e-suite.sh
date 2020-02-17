#!/bin/bash

# Copyright 2018 The Kubernetes Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
KIND_LOG_LEVEL="info"

if ! [ -z "$DEBUG" ]; then
	set -x
  KIND_LOG_LEVEL="debug"
fi

set -o errexit
set -o nounset
set -o pipefail

RED='\e[35m'
NC='\e[0m'
BGREEN='\e[32m'

K8S_VERSION=${K8S_VERSION:-v1.17.2}
KIND_CLUSTER_NAME="localstack-example"

kind --version || $(echo -e "${RED}Please install kind before running e2e tests${NC}";exit 1)
echo -e "${BGREEN}[dev-env] creating Kubernetes cluster with kind${NC}"

export KUBECONFIG="${HOME}/.kube/kind-config-${KIND_CLUSTER_NAME}"

kind create cluster \
   --name ${KIND_CLUSTER_NAME} \
   --config ${DIR}/kind.yaml \
   --image "kindest/node:${K8S_VERSION}"

echo -e "${BGREEN}building application & e2e images${NC}"
docker build -t localstack-example:test -f $DIR/../Dockerfile $DIR/../
docker build -t localstack-example-e2e:test -f $DIR/Dockerfile $DIR/../
kind load docker-image --name="${KIND_CLUSTER_NAME}" localstack-example-e2e:test
kind load docker-image --name="${KIND_CLUSTER_NAME}" localstack-example:test

function cleanup {
  set +e
  kubectl delete pod e2e 2>/dev/null
  kubectl delete -f ${DIR}/localstack.deployment.yaml 2>/dev/null
  kind delete cluster \
    --name ${KIND_CLUSTER_NAME}

}
trap cleanup EXIT

echo -e "${BGREEN}Granting permissions to localstack-example e2e service account...${NC}"
kubectl create serviceaccount localstack-example-e2e || true
kubectl create clusterrolebinding permissive-binding \
  --clusterrole=cluster-admin \
  --user=admin \
  --user=kubelet \
  --serviceaccount=default:localstack-example-e2e || true

until kubectl get secret | grep -q ^localstack-example-e2e-token; do \
  echo -e "waiting for api token"; \
  sleep 3; \
done

echo -e "${BGREEN}Deploying app...${NC}"
kubectl apply -f ${DIR}/k8s.app.deployment.yaml
kubectl apply -f ${DIR}/k8s.localstack.deployment.yaml
kubectl rollout status deploy/localstack
kubectl rollout status deploy/localstack-example-app

echo -e "${BGREEN}Starting localstack-example e2e tests...${NC}"

kubectl run \
  --attach \
  --restart=Never \
  --env="LOCALSTACK=true" \
  --env="LOCALSTACK_SSM_URL=http://ssm" \
  --env="AWS_ACCESS_KEY_ID=foobar" \
  --env="AWS_SECRET_ACCESS_KEY=foobar" \
  --env="AWS_DEFAULT_REGION=eu-central-1" \
  --env="AWS_REGION=eu-central-1" \
  --generator=run-pod/v1 \
  --overrides='{ "apiVersion": "v1", "spec":{"serviceAccountName": "localstack-example-e2e"}}' \
  e2e --image=localstack-example-e2e:test
