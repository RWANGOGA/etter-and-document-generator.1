import re
import subprocess
import tempfile
import os
import html as html_module
from jinja2 import Environment, BaseLoader
from bs4 import BeautifulSoup, NavigableString, Tag
from app.schemas import LetterData

LATEX_SPECIAL = {
    '&': r'\&', '%': r'\%', '$': r'\$', '#': r'\#', '_': r'\_',
    '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}',
    '^': r'\textasciicircum{}', '\\': r'\textbackslash{}',
}


def escape_latex(text: str) -> str:
    if not text:
        return ''
    pattern = re.compile('|'.join(re.escape(k) for k in LATEX_SPECIAL))
    return pattern.sub(lambda m: LATEX_SPECIAL[m.group()], text)


def get_alignments(layout: str):
    return {
        'block': ('flushleft', 'flushleft'),
        'modified-block': ('flushright', 'flushright'),
        'simplified': ('center', 'flushleft'),
    }.get(layout, ('flushleft', 'flushleft'))


def format_date(date: str) -> str:
    if not date:
        return ''
    from datetime import datetime
    dt = datetime.fromisoformat(date)
    return dt.strftime('%B %d, %Y')


LETTER_TEMPLATE = r"""
\documentclass[12pt]{letter}
\usepackage[margin=1in]{geometry}
\usepackage{times}
\begin{document}

\begin{ {{ sender_env }} }
\textbf{ {{ sender_name }} } \\
{{ sender_address }} \\
{{ sender_city }} \\
{{ sender_email }} | {{ sender_phone }}
\end{ {{ sender_env }} }

\vspace{1em}

\begin{ {{ date_env }} }
{{ formatted_date }}
\end{ {{ date_env }} }

\vspace{1em}

\textbf{ {{ recipient_name }} } \\
{{ recipient_title }} \\
{{ recipient_company }} \\
{{ recipient_address }} \\
{{ recipient_city }}

\vspace{1em}

Dear {{ salutation_name }},

\vspace{0.5em}

{% if subject_line %}
\begin{center}
\textbf{\underline{ {{ subject_line }} }}
\end{center}
{% endif %}

{{ body }}

\vspace{2em}

Sincerely, \\[2em]
\textbf{ {{ sender_name }} }

\end{document}
"""


def render_letter_latex(data: LetterData, layout: str) -> str:
    sender_env, date_env = get_alignments(layout)
    salutation_name = data.recipientName.split(' ')[0] if data.recipientName else 'Sir/Madam'
    subject_line = f"RE: {data.subject.upper()}" if data.subject.strip() else None

    env = Environment(loader=BaseLoader())
    template = env.from_string(LETTER_TEMPLATE)

    return template.render(
        sender_env=sender_env,
        date_env=date_env,
        sender_name=escape_latex(data.senderName),
        sender_address=escape_latex(data.senderAddress),
        sender_city=escape_latex(data.senderCity),
        sender_email=escape_latex(data.senderEmail),
        sender_phone=escape_latex(data.senderPhone),
        formatted_date=escape_latex(format_date(data.date)),
        recipient_name=escape_latex(data.recipientName),
        recipient_title=escape_latex(data.recipientTitle),
        recipient_company=escape_latex(data.recipientCompany),
        recipient_address=escape_latex(data.recipientAddress),
        recipient_city=escape_latex(data.recipientCity),
        salutation_name=escape_latex(salutation_name),
        subject_line=escape_latex(subject_line) if subject_line else None,
        body=escape_latex(data.body).replace('\n', r'\\'),
    )


DOCUMENT_TEMPLATE = r"""
\documentclass[12pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{times}
\usepackage{parskip}
\usepackage{enumitem}
\title{ {{ title }} }
\date{}
\begin{document}
\maketitle

{% if subtitle %}
\textit{ {{ subtitle }} }
\vspace{1em}
{% endif %}

{{ body }}

\end{document}
"""


def _inline_to_latex(node) -> str:
    """Convert inline-level content (text + bold/italic/etc) to LaTeX, entities decoded."""
    if isinstance(node, NavigableString):
        text = html_module.unescape(str(node))
        return escape_latex(text)

    if not isinstance(node, Tag):
        return ''

    inner = ''.join(_inline_to_latex(child) for child in node.children)

    if node.name in ('strong', 'b'):
        return r'\textbf{' + inner + '}'
    if node.name in ('em', 'i'):
        return r'\textit{' + inner + '}'
    if node.name == 'u':
        return r'\underline{' + inner + '}'
    if node.name == 'br':
        return r'\\' + '\n'
    if node.name == 'a':
        return inner  # keep link text, drop href (no hyperref configured)

    return inner


def _block_to_latex(node) -> str:
    """Convert a block-level element (p, h1-h3, ul, ol) to a LaTeX chunk."""
    if isinstance(node, NavigableString):
        text = html_module.unescape(str(node)).strip()
        return escape_latex(text) + '\n\n' if text else ''

    if not isinstance(node, Tag):
        return ''

    if node.name == 'h1':
        return r'\section*{' + _inline_to_latex_children(node) + '}\n\n'
    if node.name == 'h2':
        return r'\subsection*{' + _inline_to_latex_children(node) + '}\n\n'
    if node.name == 'h3':
        return r'\subsubsection*{' + _inline_to_latex_children(node) + '}\n\n'

    if node.name == 'p':
        content = _inline_to_latex_children(node).strip()
        return content + '\n\n' if content else ''

    if node.name in ('ul', 'ol'):
        env_name = 'itemize' if node.name == 'ul' else 'enumerate'
        items = []
        for li in node.find_all('li', recursive=False):
            item_text = _inline_to_latex_children(li).strip()
            items.append(r'\item ' + item_text)
        items_block = '\n'.join(items)
        return f'\\begin{{{env_name}}}\n{items_block}\n\\end{{{env_name}}}\n\n'

    if node.name == 'blockquote':
        content = _inline_to_latex_children(node).strip()
        return f'\\begin{{quote}}\n{content}\n\\end{{quote}}\n\n'

    # Fallback: recurse into unknown block containers (e.g. div)
    parts = []
    for child in node.children:
        if isinstance(child, Tag) and child.name in (
            'p', 'h1', 'h2', 'h3', 'ul', 'ol', 'blockquote', 'div'
        ):
            parts.append(_block_to_latex(child))
        else:
            parts.append(_inline_to_latex(child))
    return ''.join(parts)


def _inline_to_latex_children(node) -> str:
    return ''.join(_inline_to_latex(child) for child in node.children)


def html_to_latex_body(html: str) -> str:
    soup = BeautifulSoup(html or '', 'html.parser')
    parts = []
    for child in soup.children:
        parts.append(_block_to_latex(child))
    body = ''.join(parts).strip()
    return body if body else 'No content yet.'


def render_document_latex(title: str, subtitle: str, body_html: str) -> str:
    body_tex = html_to_latex_body(body_html)

    env = Environment(loader=BaseLoader())
    template = env.from_string(DOCUMENT_TEMPLATE)

    return template.render(
        title=escape_latex(title.strip() or 'Untitled Document'),
        subtitle=escape_latex(subtitle) if subtitle else None,
        body=body_tex,
    )


def compile_latex_to_pdf(tex_source: str) -> bytes:
    with tempfile.TemporaryDirectory() as tmpdir:
        tex_path = os.path.join(tmpdir, 'letter.tex')
        with open(tex_path, 'w') as f:
            f.write(tex_source)

        result = subprocess.run(
            ['pdflatex', '-interaction=nonstopmode', '-output-directory', tmpdir, tex_path],
            capture_output=True, timeout=30,
        )

        pdf_path = os.path.join(tmpdir, 'letter.pdf')
        if not os.path.exists(pdf_path):
            raise RuntimeError(f"LaTeX compilation failed: {result.stdout.decode()[-2000:]}")

        with open(pdf_path, 'rb') as f:
            return f.read()