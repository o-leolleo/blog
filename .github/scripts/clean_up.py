#!/usr/bin/env python3
from dataclasses import dataclass, field
import os
from typing import Dict
import requests
from dotenv import load_dotenv

load_dotenv()

@dataclass
class ClientConfig:
    endpoint: str
    token: str
    extra_headers: Dict[str, str] = field(default_factory=dict)

    @property
    def headers(self):
        return {
            **self.extra_headers,
            'Authorization': f"Bearer {self.token}",
        }

@dataclass
class Config:
    ref_slug: str
    cloudflare: ClientConfig
    github: ClientConfig

config = Config(
    ref_slug=os.environ['REF_SLUG'],

    cloudflare=ClientConfig(
        endpoint=f"https://api.cloudflare.com/client/v4/accounts/{os.environ['CF_ACCOUNT_ID']}/pages/projects/{os.environ['CF_PROJECT_NAME']}/deployments",
        token=os.environ['CF_API_TOKEN'],
        extra_headers={
            'Content-Type': 'application/json',
        }
    ),

    github=ClientConfig(
        endpoint=f"https://api.github.com/repos/{os.environ['GITHUB_REPOSITORY']}/environments",
        token=os.environ['GH_REPO_TOKEN'],
        extra_headers={
            'X-GitHub-Api-Version': '2022-11-28',
            'Accept': 'application/vnd.github+json',
        }
    )
)

def main():
    print('Starting...')
    print(f"Deleting GitHub Environment {config.ref_slug}...")
    delete_github_environment()

    for d in fetch_deployments():
        print(f"Deleting Cloudflare deployment {d['id']} for slug {config.ref_slug}")
        delete_deployment(d)

    print('DONE!')

def delete_github_environment():
    try:
        r = requests.delete(f"{config.github.endpoint}/{config.ref_slug}", headers=config.github.headers)
        r.raise_for_status()
    except requests.HTTPError as e:
        print('Error', e.response.status_code, e.response.json())


def delete_deployment(deployment):
    try:
        r = requests.delete(f"{config.cloudflare.endpoint}/{deployment['id']}",
                            headers=config.cloudflare.headers,
                            params={'force': True})

        r.raise_for_status()
    except requests.HTTPError as e:
        print('Error', e.response.status_code, e.response.json())


def fetch_deployments():
    page = 1

    while True:
        data = requests.get(config.cloudflare.endpoint,
                            headers=config.cloudflare.headers,
                            params={'page': page}).json()

        if not data['result']:
            return

        for d in data['result']:
            if is_deployment_to_ref_slug(d):
                yield d

        page += 1

def is_deployment_to_ref_slug(deployment):
    return deployment['deployment_trigger']['metadata']['branch'] == config.ref_slug

if __name__ == '__main__':
    main()
