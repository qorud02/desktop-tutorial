"""
Figma API Client
Figma REST API를 통해 파일, 컴포넌트, 스타일, 이미지를 가져오는 클라이언트입니다.
"""

import os
import requests
from typing import Optional


class FigmaClient:
    BASE_URL = "https://api.figma.com/v1"

    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token or os.getenv("FIGMA_ACCESS_TOKEN")
        if not self.access_token:
            raise ValueError(
                "Figma access token이 필요합니다. "
                "FIGMA_ACCESS_TOKEN 환경 변수를 설정하거나 access_token을 직접 전달하세요."
            )
        self.session = requests.Session()
        self.session.headers.update({"X-Figma-Token": self.access_token})

    def _get(self, path: str, params: Optional[dict] = None) -> dict:
        url = f"{self.BASE_URL}{path}"
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()

    # ── 파일 ──────────────────────────────────────────────────────────────────

    def get_file(self, file_key: str, depth: Optional[int] = None) -> dict:
        """Figma 파일 전체 구조를 가져옵니다."""
        params = {}
        if depth is not None:
            params["depth"] = depth
        return self._get(f"/files/{file_key}", params=params)

    def get_file_nodes(self, file_key: str, node_ids: list[str]) -> dict:
        """특정 노드(들)의 데이터를 가져옵니다."""
        params = {"ids": ",".join(node_ids)}
        return self._get(f"/files/{file_key}/nodes", params=params)

    def get_file_meta(self, file_key: str) -> dict:
        """파일 이름, 최종 수정 시각 등 기본 메타 정보를 반환합니다."""
        data = self.get_file(file_key, depth=1)
        return {
            "name": data.get("name"),
            "last_modified": data.get("lastModified"),
            "version": data.get("version"),
            "thumbnail_url": data.get("thumbnailUrl"),
        }

    # ── 이미지 내보내기 ────────────────────────────────────────────────────────

    def export_images(
        self,
        file_key: str,
        node_ids: list[str],
        fmt: str = "png",
        scale: float = 1.0,
    ) -> dict[str, str]:
        """노드를 이미지 URL로 내보냅니다. fmt: png | jpg | svg | pdf"""
        params = {
            "ids": ",".join(node_ids),
            "format": fmt,
            "scale": scale,
        }
        result = self._get(f"/images/{file_key}", params=params)
        return result.get("images", {})

    def download_image(self, url: str, save_path: str) -> None:
        """이미지 URL에서 파일을 다운로드합니다."""
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        os.makedirs(os.path.dirname(save_path) or ".", exist_ok=True)
        with open(save_path, "wb") as f:
            f.write(response.content)

    # ── 컴포넌트 & 스타일 ──────────────────────────────────────────────────────

    def get_components(self, file_key: str) -> list[dict]:
        """파일에 정의된 컴포넌트 목록을 반환합니다."""
        data = self._get(f"/files/{file_key}/components")
        return data.get("meta", {}).get("components", [])

    def get_styles(self, file_key: str) -> list[dict]:
        """파일에 정의된 스타일(색상, 텍스트 등) 목록을 반환합니다."""
        data = self._get(f"/files/{file_key}/styles")
        return data.get("meta", {}).get("styles", [])

    # ── 댓글 ──────────────────────────────────────────────────────────────────

    def get_comments(self, file_key: str) -> list[dict]:
        """파일의 댓글 목록을 반환합니다."""
        data = self._get(f"/files/{file_key}/comments")
        return data.get("comments", [])

    # ── 팀 & 프로젝트 ─────────────────────────────────────────────────────────

    def get_team_projects(self, team_id: str) -> list[dict]:
        """팀의 프로젝트 목록을 반환합니다."""
        data = self._get(f"/teams/{team_id}/projects")
        return data.get("projects", [])

    def get_project_files(self, project_id: str) -> list[dict]:
        """프로젝트의 파일 목록을 반환합니다."""
        data = self._get(f"/projects/{project_id}/files")
        return data.get("files", [])

    # ── 유틸리티 ──────────────────────────────────────────────────────────────

    @staticmethod
    def extract_file_key(figma_url: str) -> str:
        """Figma URL에서 file key를 추출합니다.

        예: https://www.figma.com/file/ABC123/My-Design → 'ABC123'
        """
        parts = figma_url.split("/")
        try:
            idx = parts.index("file")
            return parts[idx + 1]
        except (ValueError, IndexError):
            raise ValueError(f"Figma URL에서 file key를 찾을 수 없습니다: {figma_url}")

    def get_color_styles(self, file_key: str) -> list[dict]:
        """파일의 색상 스타일만 필터링하여 반환합니다."""
        return [s for s in self.get_styles(file_key) if s.get("style_type") == "FILL"]

    def get_text_styles(self, file_key: str) -> list[dict]:
        """파일의 텍스트 스타일만 필터링하여 반환합니다."""
        return [s for s in self.get_styles(file_key) if s.get("style_type") == "TEXT"]
