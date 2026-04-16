"""
Figma Integration - 사용 예시 모음
Figma API를 활용해 파일 정보 조회, 에셋 내보내기, 스타일 추출 등을 수행합니다.

사용법:
    python figma_integration.py <figma_url_or_file_key> [--export <node_ids>] [--styles] [--components]

환경 변수:
    FIGMA_ACCESS_TOKEN  : Figma Personal Access Token (필수)
"""

import argparse
import json
import os
import sys

from dotenv import load_dotenv

from figma_client import FigmaClient

load_dotenv()


# ── 출력 헬퍼 ─────────────────────────────────────────────────────────────────

def print_section(title: str) -> None:
    print(f"\n{'=' * 50}")
    print(f"  {title}")
    print(f"{'=' * 50}")


def print_json(data: object) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


# ── 기능 함수 ─────────────────────────────────────────────────────────────────

def show_file_info(client: FigmaClient, file_key: str) -> None:
    """파일 기본 정보를 출력합니다."""
    print_section("파일 정보")
    meta = client.get_file_meta(file_key)
    print(f"  이름          : {meta['name']}")
    print(f"  최종 수정     : {meta['last_modified']}")
    print(f"  버전          : {meta['version']}")
    if meta.get("thumbnail_url"):
        print(f"  썸네일 URL    : {meta['thumbnail_url']}")


def show_components(client: FigmaClient, file_key: str) -> None:
    """컴포넌트 목록을 출력합니다."""
    print_section("컴포넌트 목록")
    components = client.get_components(file_key)
    if not components:
        print("  컴포넌트가 없습니다.")
        return
    for comp in components:
        print(f"  - [{comp.get('node_id')}] {comp.get('name')}")
        if comp.get("description"):
            print(f"      설명: {comp['description']}")


def show_styles(client: FigmaClient, file_key: str) -> None:
    """색상 및 텍스트 스타일을 출력합니다."""
    print_section("색상 스타일")
    for s in client.get_color_styles(file_key):
        print(f"  - {s.get('name')} (node: {s.get('node_id')})")

    print_section("텍스트 스타일")
    for s in client.get_text_styles(file_key):
        print(f"  - {s.get('name')} (node: {s.get('node_id')})")


def export_nodes(
    client: FigmaClient,
    file_key: str,
    node_ids: list[str],
    fmt: str = "png",
    output_dir: str = "exports",
) -> None:
    """지정한 노드를 이미지로 내보내고 저장합니다."""
    print_section(f"이미지 내보내기 ({fmt.upper()})")
    urls = client.export_images(file_key, node_ids, fmt=fmt)
    if not urls:
        print("  내보낼 이미지가 없습니다.")
        return

    os.makedirs(output_dir, exist_ok=True)
    for node_id, url in urls.items():
        if not url:
            print(f"  [{node_id}] URL 없음 (건너뜀)")
            continue
        safe_id = node_id.replace(":", "-")
        filename = f"{safe_id}.{fmt}"
        save_path = os.path.join(output_dir, filename)
        print(f"  다운로드 중: {node_id} → {save_path}")
        client.download_image(url, save_path)
        print(f"  저장 완료: {save_path}")


def show_comments(client: FigmaClient, file_key: str) -> None:
    """파일 댓글을 출력합니다."""
    print_section("댓글")
    comments = client.get_comments(file_key)
    if not comments:
        print("  댓글이 없습니다.")
        return
    for c in comments:
        user = c.get("user", {}).get("handle", "알 수 없음")
        message = c.get("message", "")
        created = c.get("created_at", "")
        print(f"  [{created}] {user}: {message}")


def show_file_tree(client: FigmaClient, file_key: str, depth: int = 2) -> None:
    """파일 노드 트리를 depth 레벨까지 출력합니다."""
    print_section(f"파일 트리 (depth={depth})")
    data = client.get_file(file_key, depth=depth)
    document = data.get("document", {})
    _print_node(document, indent=0)


def _print_node(node: dict, indent: int) -> None:
    prefix = "  " * indent
    node_type = node.get("type", "?")
    name = node.get("name", "")
    node_id = node.get("id", "")
    print(f"{prefix}[{node_type}] {name}  (id: {node_id})")
    for child in node.get("children", []):
        _print_node(child, indent + 1)


# ── CLI ───────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Figma 파일을 연동하여 정보를 조회하고 에셋을 내보냅니다."
    )
    p.add_argument("file", help="Figma 파일 URL 또는 file key")
    p.add_argument("--info", action="store_true", default=True, help="파일 기본 정보 출력 (기본값)")
    p.add_argument("--tree", action="store_true", help="파일 노드 트리 출력")
    p.add_argument("--components", action="store_true", help="컴포넌트 목록 출력")
    p.add_argument("--styles", action="store_true", help="스타일 목록 출력")
    p.add_argument("--comments", action="store_true", help="댓글 출력")
    p.add_argument(
        "--export",
        nargs="+",
        metavar="NODE_ID",
        help="내보낼 노드 ID 목록 (예: --export 1:2 3:4)",
    )
    p.add_argument("--format", default="png", choices=["png", "jpg", "svg", "pdf"], help="내보내기 형식")
    p.add_argument("--output-dir", default="exports", help="이미지 저장 디렉토리 (기본: exports)")
    p.add_argument("--depth", type=int, default=2, help="트리 출력 depth (기본: 2)")
    return p


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    try:
        client = FigmaClient()
    except ValueError as e:
        print(f"오류: {e}", file=sys.stderr)
        sys.exit(1)

    # file key 추출
    file_key = args.file
    if file_key.startswith("http"):
        file_key = FigmaClient.extract_file_key(file_key)

    any_flag = args.tree or args.components or args.styles or args.comments or args.export

    # 기본 정보는 별도 플래그가 없을 때 또는 --info 명시 시 항상 출력
    if not any_flag or args.info:
        show_file_info(client, file_key)

    if args.tree:
        show_file_tree(client, file_key, depth=args.depth)

    if args.components:
        show_components(client, file_key)

    if args.styles:
        show_styles(client, file_key)

    if args.comments:
        show_comments(client, file_key)

    if args.export:
        export_nodes(client, file_key, args.export, fmt=args.format, output_dir=args.output_dir)


if __name__ == "__main__":
    main()
