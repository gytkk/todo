{{/*
Expand the name of the chart.
*/}}
{{- define "calendar-todo.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "calendar-todo.fullname" -}}
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
{{- define "calendar-todo.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "calendar-todo.labels" -}}
helm.sh/chart: {{ include "calendar-todo.chart" . }}
{{ include "calendar-todo.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "calendar-todo.selectorLabels" -}}
app.kubernetes.io/name: {{ include "calendar-todo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "calendar-todo.frontend.labels" -}}
helm.sh/chart: {{ include "calendar-todo.chart" . }}
{{ include "calendar-todo.frontend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "calendar-todo.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "calendar-todo.name" . }}-frontend
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Backend labels
*/}}
{{- define "calendar-todo.backend.labels" -}}
helm.sh/chart: {{ include "calendar-todo.chart" . }}
{{ include "calendar-todo.backend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "calendar-todo.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "calendar-todo.name" . }}-backend
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "calendar-todo.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "calendar-todo.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the database URL
*/}}
{{- define "calendar-todo.databaseUrl" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "postgresql://%s:%s@%s-postgresql:5432/%s" .Values.postgresql.auth.username .Values.postgresql.auth.password (include "calendar-todo.fullname" .) .Values.postgresql.auth.database }}
{{- else }}
{{- printf "postgresql://%s:%s@%s:%d/%s" .Values.externalDatabase.username .Values.externalDatabase.password .Values.externalDatabase.host (.Values.externalDatabase.port | int) .Values.externalDatabase.database }}
{{- end }}
{{- end }}

{{/*
Create the JWT secret name
*/}}
{{- define "calendar-todo.jwtSecretName" -}}
{{- if .Values.jwt.existingSecret }}
{{- .Values.jwt.existingSecret }}
{{- else }}
{{- printf "%s-jwt" (include "calendar-todo.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Create the database secret name
*/}}
{{- define "calendar-todo.databaseSecretName" -}}
{{- if .Values.externalDatabase.existingSecret }}
{{- .Values.externalDatabase.existingSecret }}
{{- else if .Values.postgresql.enabled }}
{{- printf "%s-postgresql" (include "calendar-todo.fullname" .) }}
{{- else }}
{{- printf "%s-database" (include "calendar-todo.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Get the database password key
*/}}
{{- define "calendar-todo.databaseSecretPasswordKey" -}}
{{- if .Values.externalDatabase.existingSecret }}
{{- .Values.externalDatabase.existingSecretPasswordKey }}
{{- else if .Values.postgresql.enabled }}
{{- "postgres-password" }}
{{- else }}
{{- "database-password" }}
{{- end }}
{{- end }}

{{/*
Frontend image
*/}}
{{- define "calendar-todo.frontend.image" -}}
{{- if .Values.image.registry }}
{{- printf "%s/%s:%s" .Values.image.registry .Values.frontend.image.repository (.Values.frontend.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.frontend.image.repository (.Values.frontend.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}

{{/*
Backend image
*/}}
{{- define "calendar-todo.backend.image" -}}
{{- if .Values.image.registry }}
{{- printf "%s/%s:%s" .Values.image.registry .Values.backend.image.repository (.Values.backend.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.backend.image.repository (.Values.backend.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}

{{/*
DB Migration image
*/}}
{{- define "calendar-todo.dbMigration.image" -}}
{{- if .Values.image.registry }}
{{- printf "%s/%s:%s" .Values.image.registry .Values.dbMigration.image.repository (.Values.dbMigration.image.tag | default .Chart.AppVersion) }}
{{- else }}
{{- printf "%s:%s" .Values.dbMigration.image.repository (.Values.dbMigration.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}