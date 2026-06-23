import os
import re

def wrap_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Text tags: <Text>English / Urdu</Text>
    # Match > then text with / then <
    # Group 1: English part, Group 2: Urdu part
    def text_replacer(match):
        eng = match.group(1).strip()
        urd = match.group(2).strip()
        return f">{{t('{eng}', '{urd}')}}<"
    
    content = re.sub(r'>\s*([^</]+?)\s*/\s*([\u0600-\u06FF\s:.,!?-]+?)\s*<', text_replacer, content)

    # 2. Placeholders or string literals: "English / Urdu" or 'English / Urdu'
    def quote_replacer(match):
        quote = match.group(1)
        eng = match.group(2).strip()
        urd = match.group(3).strip()
        # If it's inside a JSX prop like placeholder="...", we need to change it to placeholder={t('...')}
        # But wait, this regex matches just the string.
        # It's safer to just change the literal: "Eng / Ur" -> t('Eng', 'Ur')
        # Wait! If it's placeholder="Eng / Ur", it becomes placeholder=t('Eng', 'Ur'), which is INVALID JSX!
        # It must become placeholder={t('Eng', 'Ur')}
        return match.group(0) # We will do a separate pass for props

    # Let's target specific props: placeholder="Eng / Ur"
    def prop_replacer(match):
        prop = match.group(1)
        eng = match.group(2).strip()
        urd = match.group(3).strip()
        # Escape single quotes in strings
        eng = eng.replace("'", "\\'")
        urd = urd.replace("'", "\\'")
        return f"{prop}={{t('{eng}', '{urd}')}}"
    
    content = re.sub(r'(\w+)=[\"\']([^\"\']+?)\s*/\s*([\u0600-\u06FF\s:.,!?-]+?)[\"\']', prop_replacer, content)

    # 3. What about string literals in JS code? like alert('Eng / Ur') or return 'Eng / Ur'
    def js_string_replacer(match):
        prefix = match.group(1)
        eng = match.group(2).strip()
        urd = match.group(3).strip()
        eng = eng.replace("'", "\\'")
        urd = urd.replace("'", "\\'")
        return f"{prefix}t('{eng}', '{urd}')"
    
    content = re.sub(r'([(=:])\s*[\"\']([^\"\']+?)\s*/\s*([\u0600-\u06FF\s:.,!?-]+?)[\"\']', js_string_replacer, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        print(f"Wrapped {filepath}")

for root, dirs, files in os.walk('src/screens'):
    for file in files:
        if file.endswith('.jsx'):
            wrap_file(os.path.join(root, file))
