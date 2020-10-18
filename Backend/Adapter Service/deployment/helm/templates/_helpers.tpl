{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "adapter-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "adapter-service.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "adapter-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "adapter-service.labels" -}}
helm.sh/chart: {{ include "adapter-service.chart" . }}
{{ include "adapter-service.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "adapter-service.selectorLabels" -}}
app.kubernetes.io/name: {{ include "adapter-service.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "adapter-service.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "adapter-service.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "adapter-service.databaseUrl" -}}
{{- with .Values.database -}}
{{ required "Database protocol needed" .protocol }}://{{ required "Database service name required" .databaseServiceName }}.{{ $.Release.Namespace }}.svc.cluster.local/{{ required "Database name required" .databaseName }}?ssl={{ .enableSSL }}
{{- if .replicaSetName -}}
&replicaSet={{ .replicaSetName }}
{{- end }}
{{- if .portName -}}
&portName={{ .portName }}
{{- end }}
{{- end }}
{{- end }}

{{- define "adapter-service.gatewayIds" -}}
{{- range $idx, $val := (kindIs "string" .gatewayName | ternary (list .gatewayName) .gatewayName) -}}
{{- if ne $idx 0 }},{{end -}}
{{ (get $.apiGateway $val).id | quote }}
{{- end }}
{{- end }}

{{- define "adapter-service.hosts" -}}
{{- range $idx, $val := (kindIs "string" .gatewayName | ternary (list .gatewayName) .gatewayName) -}}
{{- if ne $idx 0 }}|{{end -}}
{{ include "adapter-service.escapeRegex" (get $.apiGateway $val).hostname }}
{{- end }}
{{- end }}

{{- define "adapter-service.escapeRegex" -}}
{{ regexReplaceAll "([.*?])" . "\\\\${1}"}}
{{- end }}

{{/*
Create the internal api gateway hostname
*/}}
{{- define "adapter-service.internalGatewayUrl" -}}
{{- with .Values.apiGateway.internal -}}
{{ required "Gateway protocol needed" .protocol }}://{{ required "Gateway hostname required" .hostname }}
{{- if .port -}}
:{{ .port }}
{{- end }}
{{- end }}
{{- end }}