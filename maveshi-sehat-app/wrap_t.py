import os
import re

def wrap_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find "English / Urdu" inside tags or attributes
    # and replace with t('English', 'Urdu')
    original = content
    content = re.sub(r'>([^<>]+?)\s*/\s*([\u0600-\u06FF\s]+)</', r'>{t(' + "'" + r'\1' + "', '" + r'\2' + "')}</", content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Wrapped {filepath}")

wrap_file('src/screens/user/MarketplaceScreen.jsx')
