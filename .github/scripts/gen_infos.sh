#!/usr/bin/env bash

# Taken from https://github.com/rlespinasse/slugify-value/blob/v1.x/slugify.sh
ref_name_slug=$(\
  echo ${GITHUB_REF_NAME} \
    | sed -E -e 's#refs/[^\/]*/##;s/[^a-zA-Z0-9._-]+/-/g;s/^-*//' -e 's/-*$//' \
)

echo "infos=${ref_name_slug}" >> "${GITHUB_OUTPUT}"

if [ "${ref_name_slug}" = "main" ]; then
  env_name="${LIVE_ENV_NAME}"
  url="${LIVE_ENV_URL}"
else
  env_name="${ref_name_slug}"
  url="https://${ref_name_slug}.${PREVIEW_ENV_DOMAIN}"
fi

echo "
ref_name_slug=${ref_name_slug}
env_name=${env_name}
url=${URL}
" >> "${GITHUB_OUTPUT}"
