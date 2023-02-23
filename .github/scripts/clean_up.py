from dataclasses import dataclass
import os
import requests

@dataclass
class CloudflareConfig:
    token: str
    account_id: str
    project_name: str

    @property
    def endpoint(self):
        return f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/pages/projects/{self.project_name}/deployments"


@dataclass
class GitHubConfig:
    owner: str
    repo: str
    token: str

    @property
    def endpoint(self):
        return f"https://api.github.com/repos/{self.owner}/{self.repo}/environments"

@dataclass
class Config:
    ref_slug: str
    cloudflare: CloudflareConfig
    github: GitHubConfig

config = Config(
    ref_slug=os.environ['REF_SLUG'],

    cloudflare=CloudflareConfig(
        token=os.environ['CF_API_TOKEN'],
        account_id=os.environ['CF_ACCOUNT_ID'],
    ),

    github=GitHubConfig(
        owner=os.environ['REPO_OWNER'],
        repo=os.environ['REPO_NAME'],
        token=os.environ['REPO_TOKEN'],
    )
)

def main():
    print(requests.get(config.cloudflare.endpoint))

if __name__ == '__main__':
    main()
