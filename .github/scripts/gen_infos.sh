#!/usr/bin/env bash

# Taken from https://github.com/rlespinasse/slugify-value/blob/v1.x/slugify.sh
slug=$(\
  echo ${GITHUB_REF_NAME} \
    | sed -E -e 's#refs/[^\/]*/##;s/[^a-zA-Z0-9._-]+/-/g;s/^-*//' -e 's/-*$//' \
)

echo "infos=${slug}" >> "${GITHUB_OUTPUT}"

if [ "${slug}" = "main" ]; then
  env_name="${LIVE_ENV_NAME}"
  url="${LIVE_ENV_URL}"
else
  env_name="${slug}"
  url="https://${slug}.${PREVIEW_ENV_DOMAIN}"
fi

echo "
slug=${slug}
env_name=${env_name}
url=${URL}
" >> "${GITHUB_OUTPUT}"
