#!/usr/bin/env python3
"""
Convert Markdown to PDF with proper table rendering using markdown2 + pdfkit/wkhtmltopdf fallback
"""

import markdown2
import os
import sys

def convert_md_to_html_styled(md_file, html_file):
    """Convert markdown to HTML with CSS styling for tables."""

    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Convert markdown to HTML with tables extension
    html_body = markdown2.markdown(md_content, extras=[
        'tables',
        'fenced-code-blocks',
        'header-ids',
        'toc',
        'cuddled-lists'
    ])

    # Create full HTML with styling
    html_content = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VerifyWise vs OneTrust AI Governance - Comprehensive Comparison Report</title>
    <style>
        @page {{
            size: A4;
            margin: 2cm;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
        }}

        h1 {{
            color: #13715B;
            font-size: 24pt;
            border-bottom: 3px solid #13715B;
            padding-bottom: 10px;
            margin-top: 0;
        }}

        h2 {{
            color: #13715B;
            font-size: 18pt;
            border-bottom: 2px solid #d0d5dd;
            padding-bottom: 8px;
            margin-top: 30px;
            page-break-after: avoid;
        }}

        h3 {{
            color: #2c5545;
            font-size: 14pt;
            margin-top: 25px;
            page-break-after: avoid;
        }}

        h4 {{
            color: #444;
            font-size: 12pt;
            margin-top: 20px;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10pt;
            page-break-inside: avoid;
        }}

        th {{
            background-color: #13715B;
            color: white;
            font-weight: 600;
            text-align: left;
            padding: 10px 12px;
            border: 1px solid #0d5a47;
        }}

        td {{
            padding: 8px 12px;
            border: 1px solid #d0d5dd;
            vertical-align: top;
        }}

        tr:nth-child(even) {{
            background-color: #f8f9fa;
        }}

        tr:hover {{
            background-color: #e8f5f1;
        }}

        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'SF Mono', Monaco, 'Courier New', monospace;
            font-size: 10pt;
        }}

        pre {{
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 10pt;
            border: 1px solid #d0d5dd;
        }}

        pre code {{
            background: none;
            padding: 0;
        }}

        blockquote {{
            border-left: 4px solid #13715B;
            margin: 15px 0;
            padding: 10px 20px;
            background-color: #f8f9fa;
        }}

        hr {{
            border: none;
            border-top: 2px solid #d0d5dd;
            margin: 30px 0;
        }}

        ul, ol {{
            margin: 10px 0;
            padding-left: 25px;
        }}

        li {{
            margin: 5px 0;
        }}

        strong {{
            color: #222;
        }}

        a {{
            color: #13715B;
            text-decoration: none;
        }}

        /* Status indicators */
        td:contains("✅"), td:contains("❌"), td:contains("⚠️") {{
            text-align: center;
        }}

        .toc {{
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
            border: 1px solid #d0d5dd;
        }}

        .toc a {{
            display: block;
            padding: 3px 0;
        }}

        /* Print-specific styles */
        @media print {{
            body {{
                font-size: 10pt;
            }}

            h1 {{
                font-size: 20pt;
            }}

            h2 {{
                font-size: 16pt;
            }}

            h3 {{
                font-size: 13pt;
            }}

            table {{
                font-size: 9pt;
            }}

            pre, code {{
                font-size: 9pt;
            }}
        }}
    </style>
</head>
<body>
{html_body}
</body>
</html>'''

    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"HTML created: {html_file}")
    return html_file


def main():
    docs_dir = "/Users/gorkemcetin/verifywise/docs"
    md_file = os.path.join(docs_dir, "VERIFYWISE_VS_ONETRUST_COMPARISON.md")
    html_file = os.path.join(docs_dir, "VERIFYWISE_VS_ONETRUST_COMPARISON_styled.html")
    pdf_file = os.path.expanduser("~/Desktop/VERIFYWISE_VS_ONETRUST_COMPARISON.pdf")

    # Convert MD to styled HTML
    convert_md_to_html_styled(md_file, html_file)

    # Try different PDF conversion methods
    import subprocess

    # Method 1: Try Chrome headless
    try:
        result = subprocess.run([
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '--headless',
            '--disable-gpu',
            '--print-to-pdf=' + pdf_file,
            '--no-margins',
            html_file
        ], capture_output=True, text=True, timeout=60)

        if os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 1000:
            print(f"PDF created successfully using Chrome: {pdf_file}")
            return
    except Exception as e:
        print(f"Chrome method failed: {e}")

    # Method 2: Try Safari/macOS print
    try:
        # Use cupsfilter on macOS
        result = subprocess.run([
            'cupsfilter', html_file
        ], capture_output=True, timeout=60)

        if result.returncode == 0:
            with open(pdf_file, 'wb') as f:
                f.write(result.stdout)
            print(f"PDF created using cupsfilter: {pdf_file}")
            return
    except Exception as e:
        print(f"cupsfilter method failed: {e}")

    print(f"\nHTML file created at: {html_file}")
    print("To convert to PDF, open the HTML file in a browser and use Print > Save as PDF")
    print(f"Target PDF location: {pdf_file}")


if __name__ == "__main__":
    main()
