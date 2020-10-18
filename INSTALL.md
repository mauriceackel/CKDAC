# Installation Instruction

## Install helm
curl -fsSL https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash

## Install ambassador
helm repo add datawire https://www.getambassador.io
kubectl create namespace ambassador && helm install ambassador --namespace ambassador datawire/ambassador

## Install kubedb
helm repo add appscode https://charts.appscode.com/stable/
helm install kubedb-operator --version v0.13.0-rc.0 --namespace kube-system appscode/kubedb && \
kubectl --namespace=kube-system wait --for=condition=ready pod -l "release=kubedb-operator, app=kubedb" && \
helm install kubedb-catalog --version v0.13.0-rc.0 --namespace kube-system appscode/kubedb-catalog

## Install application
helm repo add ckdac https://mauriceackel.github.io/CKDAC/
helm install ckdac ckdac/ckdac
