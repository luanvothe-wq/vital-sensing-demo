#!/usr/bin/env python3
"""
Codebase Analyzer for Rule Preset Generation

Analyzes a codebase and outputs structured information for generating rule-presets.

Usage:
    analyze-codebase.py [path] [--json] [--depth N]

Examples:
    analyze-codebase.py .
    analyze-codebase.py /path/to/project --json
    analyze-codebase.py . --depth 4
"""

import json
import os
import sys
from pathlib import Path
from typing import Any

# Directories to skip
SKIP_DIRS = {
    'node_modules', 'vendor', '.git', 'dist', 'build', '.next', '.nuxt',
    '__pycache__', 'venv', '.venv', '.idea', '.vscode', 'coverage',
    '.cache', '.turbo', '.output', 'target', '.gradle', 'Pods',
    '.dart_tool', '.pub-cache', 'android/build', 'ios/Pods'
}

# Framework detection patterns
FRAMEWORK_PATTERNS = {
    # JavaScript/TypeScript
    'next.js': {'files': ['next.config.js', 'next.config.mjs', 'next.config.ts'], 'deps': ['next']},
    'nuxt': {'files': ['nuxt.config.js', 'nuxt.config.ts'], 'deps': ['nuxt']},
    'react': {'deps': ['react', 'react-dom']},
    'vue': {'deps': ['vue']},
    'angular': {'files': ['angular.json'], 'deps': ['@angular/core']},
    'svelte': {'files': ['svelte.config.js'], 'deps': ['svelte']},
    'express': {'deps': ['express']},
    'nestjs': {'deps': ['@nestjs/core']},
    'hono': {'deps': ['hono']},
    'fastify': {'deps': ['fastify']},

    # PHP
    'laravel': {'files': ['artisan'], 'deps_composer': ['laravel/framework']},
    'symfony': {'files': ['symfony.yaml', 'config/packages'], 'deps_composer': ['symfony/framework-bundle']},

    # Python
    'django': {'deps_python': ['django'], 'files': ['manage.py']},
    'fastapi': {'deps_python': ['fastapi']},
    'flask': {'deps_python': ['flask']},

    # Go
    'gin': {'deps_go': ['github.com/gin-gonic/gin']},
    'fiber': {'deps_go': ['github.com/gofiber/fiber']},

    # Mobile
    'flutter': {'files': ['pubspec.yaml']},
    'react-native': {'files': ['app.json', 'metro.config.js'], 'deps': ['react-native']},

    # Desktop
    'tauri': {'files': ['tauri.conf.json', 'src-tauri']},
    'electron': {'deps': ['electron']},

    # Monorepo tools
    'pnpm-workspace': {'files': ['pnpm-workspace.yaml']},
    'turborepo': {'files': ['turbo.json']},
    'nx': {'files': ['nx.json']},
    'lerna': {'files': ['lerna.json']},

    # Docs
    'vitepress': {'deps': ['vitepress']},
    'docusaurus': {'deps': ['@docusaurus/core']},
    'mkdocs': {'files': ['mkdocs.yml']},

    # Bot
    'discord.js': {'deps': ['discord.js']},
    'telegraf': {'deps': ['telegraf']},
}

# UI/CSS framework detection
UI_PATTERNS = {
    'tailwindcss': {'deps': ['tailwindcss'], 'files': ['tailwind.config.js', 'tailwind.config.ts']},
    'shadcn-ui': {'dirs': ['components/ui'], 'files': ['components.json']},
    'radix-ui': {'deps_pattern': '@radix-ui/'},
    'chakra-ui': {'deps': ['@chakra-ui/react']},
    'material-ui': {'deps': ['@mui/material']},
    'ant-design': {'deps': ['antd']},
    'bootstrap': {'deps': ['bootstrap']},
    'vuetify': {'deps': ['vuetify']},
}


def get_directory_tree(root: Path, max_depth: int = 3) -> list[str]:
    """Get directory tree, skipping irrelevant directories."""
    dirs = []
    root = root.resolve()

    for dirpath, dirnames, _ in os.walk(root):
        # Skip directories
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]

        rel_path = Path(dirpath).relative_to(root)
        depth = len(rel_path.parts)

        if depth > max_depth:
            dirnames.clear()
            continue

        if str(rel_path) != '.':
            dirs.append(str(rel_path))

    return sorted(dirs)


def read_json_file(path: Path) -> dict | None:
    """Safely read a JSON file."""
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None


def detect_package_json(root: Path) -> dict[str, Any]:
    """Extract info from package.json."""
    pkg_path = root / 'package.json'
    if not pkg_path.exists():
        return {}

    data = read_json_file(pkg_path)
    if not data:
        return {}

    return {
        'name': data.get('name', ''),
        'dependencies': list(data.get('dependencies', {}).keys()),
        'devDependencies': list(data.get('devDependencies', {}).keys()),
        'scripts': list(data.get('scripts', {}).keys()),
        'workspaces': data.get('workspaces', []),
    }


def detect_composer_json(root: Path) -> dict[str, Any]:
    """Extract info from composer.json."""
    pkg_path = root / 'composer.json'
    if not pkg_path.exists():
        return {}

    data = read_json_file(pkg_path)
    if not data:
        return {}

    return {
        'name': data.get('name', ''),
        'require': list(data.get('require', {}).keys()),
        'require-dev': list(data.get('require-dev', {}).keys()),
    }


def detect_frameworks(root: Path, pkg_info: dict, composer_info: dict) -> list[str]:
    """Detect which frameworks are used."""
    detected = []
    all_deps = set(pkg_info.get('dependencies', []) + pkg_info.get('devDependencies', []))
    composer_deps = set(composer_info.get('require', []) + composer_info.get('require-dev', []))

    for name, patterns in FRAMEWORK_PATTERNS.items():
        # Check files
        if 'files' in patterns:
            for f in patterns['files']:
                if (root / f).exists():
                    detected.append(name)
                    break

        # Check npm deps
        if 'deps' in patterns and not any(name == d for d in detected):
            if any(dep in all_deps for dep in patterns['deps']):
                detected.append(name)

        # Check composer deps
        if 'deps_composer' in patterns and not any(name == d for d in detected):
            if any(dep in composer_deps for dep in patterns['deps_composer']):
                detected.append(name)

    return list(set(detected))


def detect_ui_frameworks(root: Path, pkg_info: dict) -> list[str]:
    """Detect UI/CSS frameworks."""
    detected = []
    all_deps = set(pkg_info.get('dependencies', []) + pkg_info.get('devDependencies', []))

    for name, patterns in UI_PATTERNS.items():
        # Check files
        if 'files' in patterns:
            for f in patterns['files']:
                if (root / f).exists():
                    detected.append(name)
                    break

        # Check dirs
        if 'dirs' in patterns and name not in detected:
            for d in patterns['dirs']:
                if (root / d).is_dir():
                    detected.append(name)
                    break

        # Check deps
        if 'deps' in patterns and name not in detected:
            if any(dep in all_deps for dep in patterns['deps']):
                detected.append(name)

        # Check deps pattern
        if 'deps_pattern' in patterns and name not in detected:
            pattern = patterns['deps_pattern']
            if any(dep.startswith(pattern) for dep in all_deps):
                detected.append(name)

    return list(set(detected))


def detect_routing(root: Path, frameworks: list[str]) -> dict[str, Any]:
    """Detect routing structure based on framework."""
    routing = {'type': None, 'paths': []}

    # Next.js
    if 'next.js' in frameworks:
        if (root / 'app').is_dir() or (root / 'src/app').is_dir():
            routing['type'] = 'next-app-router'
            routing['paths'] = ['app/' if (root / 'app').is_dir() else 'src/app/']
        elif (root / 'pages').is_dir() or (root / 'src/pages').is_dir():
            routing['type'] = 'next-pages-router'
            routing['paths'] = ['pages/' if (root / 'pages').is_dir() else 'src/pages/']

    # Nuxt
    elif 'nuxt' in frameworks:
        if (root / 'pages').is_dir():
            routing['type'] = 'nuxt-pages'
            routing['paths'] = ['pages/']

    # Laravel
    elif 'laravel' in frameworks:
        routing['type'] = 'laravel-routes'
        routing['paths'] = ['routes/api.php', 'routes/web.php']

    # NestJS
    elif 'nestjs' in frameworks:
        routing['type'] = 'nestjs-controllers'
        # Find controller files
        controllers = list(root.rglob('*.controller.ts'))
        routing['paths'] = [str(c.relative_to(root)) for c in controllers[:5]]

    # Express
    elif 'express' in frameworks or 'hono' in frameworks:
        routing['type'] = 'express-routes'
        if (root / 'routes').is_dir():
            routing['paths'] = ['routes/']
        elif (root / 'src/routes').is_dir():
            routing['paths'] = ['src/routes/']

    return routing


def detect_stack_type(frameworks: list[str], pkg_info: dict, root: Path) -> str:
    """Determine the primary stack type."""
    # Check for monorepo
    monorepo_indicators = ['pnpm-workspace', 'turborepo', 'nx', 'lerna']
    if any(f in frameworks for f in monorepo_indicators):
        return 'monorepo'

    # Check workspaces in package.json
    if pkg_info.get('workspaces'):
        return 'monorepo'

    # Check for mobile
    if 'flutter' in frameworks or 'react-native' in frameworks:
        return 'mobile'

    # Check for desktop
    if 'tauri' in frameworks or 'electron' in frameworks:
        return 'desktop'

    # Check for docs
    if 'vitepress' in frameworks or 'docusaurus' in frameworks or 'mkdocs' in frameworks:
        return 'docs'

    # Check for bot
    if 'discord.js' in frameworks or 'telegraf' in frameworks:
        return 'bot'

    # Check for CLI
    has_bin = (root / 'bin').is_dir()
    cli_deps = {'commander', 'yargs', 'meow', 'cac', 'clipanion'}
    if has_bin or cli_deps.intersection(set(pkg_info.get('dependencies', []))):
        return 'cli'

    # Frontend frameworks
    frontend_frameworks = {'next.js', 'nuxt', 'react', 'vue', 'angular', 'svelte'}
    backend_frameworks = {'express', 'nestjs', 'hono', 'fastify', 'laravel', 'symfony', 'django', 'fastapi', 'flask'}

    has_frontend = any(f in frameworks for f in frontend_frameworks)
    has_backend = any(f in frameworks for f in backend_frameworks)

    if has_frontend and has_backend:
        return 'fullstack'
    elif has_frontend:
        return 'frontend'
    elif has_backend:
        return 'backend'

    return 'unknown'


def analyze_codebase(root: Path, max_depth: int = 3) -> dict[str, Any]:
    """Main analysis function."""
    root = root.resolve()

    # Gather info
    pkg_info = detect_package_json(root)
    composer_info = detect_composer_json(root)
    frameworks = detect_frameworks(root, pkg_info, composer_info)
    ui_frameworks = detect_ui_frameworks(root, pkg_info)
    routing = detect_routing(root, frameworks)
    stack_type = detect_stack_type(frameworks, pkg_info, root)
    dir_tree = get_directory_tree(root, max_depth)

    # Detect language
    language = 'Unknown'
    if pkg_info:
        language = 'TypeScript' if (root / 'tsconfig.json').exists() else 'JavaScript'
    elif composer_info:
        language = 'PHP'
    elif (root / 'go.mod').exists():
        language = 'Go'
    elif (root / 'Cargo.toml').exists():
        language = 'Rust'
    elif (root / 'pyproject.toml').exists() or (root / 'requirements.txt').exists():
        language = 'Python'
    elif (root / 'pubspec.yaml').exists():
        language = 'Dart'

    return {
        'path': str(root),
        'stackType': stack_type,
        'language': language,
        'frameworks': frameworks,
        'uiFrameworks': ui_frameworks,
        'routing': routing,
        'packageJson': pkg_info,
        'composerJson': composer_info,
        'directoryTree': dir_tree,
        'suggestedPresetFiles': get_suggested_files(stack_type),
    }


def get_suggested_files(stack_type: str) -> dict[str, list[str]]:
    """Get suggested preset files based on stack type."""
    suggestions = {
        'frontend': {
            'required': ['01-project.md', '02-standards.md', '03-frontend.md', '09-custom.md'],
            'optional': ['05-testing.md'],
        },
        'backend': {
            'required': ['01-project.md', '02-standards.md', '04-backend.md', '09-custom.md'],
            'optional': ['05-testing.md', '06-workflow.md'],
        },
        'fullstack': {
            'required': ['01-project.md', '02-standards.md', '03-frontend.md', '04-backend.md', '09-custom.md'],
            'optional': ['05-testing.md', '06-workflow.md'],
        },
        'monorepo': {
            'required': ['01-project.md', '02-standards.md', '03-workspace.md', '09-custom.md'],
            'optional': ['04-backend.md', '05-testing.md', '06-workflow.md'],
        },
        'mobile': {
            'required': ['01-project.md', '02-standards.md', '03-frontend.md', '09-custom.md'],
            'optional': ['05-testing.md'],
        },
        'desktop': {
            'required': ['01-project.md', '02-standards.md', '03-frontend.md', '09-custom.md'],
            'optional': ['05-testing.md'],
        },
        'cli': {
            'required': ['01-project.md', '02-standards.md', '09-custom.md'],
            'optional': ['05-testing.md'],
        },
        'docs': {
            'required': ['01-project.md', '02-standards.md', '03-content.md', '09-custom.md'],
            'optional': ['04-components.md'],
        },
        'bot': {
            'required': ['01-project.md', '02-standards.md', '04-backend.md', '09-custom.md'],
            'optional': ['05-testing.md'],
        },
    }
    return suggestions.get(stack_type, suggestions['fullstack'])


def print_analysis(analysis: dict[str, Any]) -> None:
    """Print analysis in human-readable format."""
    print("=" * 60)
    print("CODEBASE ANALYSIS REPORT")
    print("=" * 60)
    print()

    print(f"Path: {analysis['path']}")
    print(f"Stack Type: {analysis['stackType']}")
    print(f"Language: {analysis['language']}")
    print()

    print("Frameworks Detected:")
    for f in analysis['frameworks']:
        print(f"  - {f}")
    print()

    if analysis['uiFrameworks']:
        print("UI/CSS Frameworks:")
        for f in analysis['uiFrameworks']:
            print(f"  - {f}")
        print()

    if analysis['routing']['type']:
        print(f"Routing: {analysis['routing']['type']}")
        for p in analysis['routing']['paths']:
            print(f"  - {p}")
        print()

    print("Suggested Preset Files:")
    files = analysis['suggestedPresetFiles']
    print("  Required:", ', '.join(files['required']))
    print("  Optional:", ', '.join(files['optional']))
    print()

    print("Directory Structure (top directories):")
    for d in analysis['directoryTree'][:15]:
        print(f"  {d}/")
    if len(analysis['directoryTree']) > 15:
        print(f"  ... and {len(analysis['directoryTree']) - 15} more")
    print()
    print("=" * 60)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Analyze codebase for rule-preset generation')
    parser.add_argument('path', nargs='?', default='.', help='Path to analyze (default: current directory)')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    parser.add_argument('--depth', type=int, default=3, help='Max directory depth (default: 3)')

    args = parser.parse_args()

    root = Path(args.path)
    if not root.exists():
        print(f"Error: Path does not exist: {root}", file=sys.stderr)
        sys.exit(1)

    analysis = analyze_codebase(root, args.depth)

    if args.json:
        print(json.dumps(analysis, indent=2))
    else:
        print_analysis(analysis)


if __name__ == "__main__":
    main()
