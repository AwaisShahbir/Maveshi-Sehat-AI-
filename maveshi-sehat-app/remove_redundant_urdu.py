import os
import re

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Remove redundant <Text style={styles.*Urdu*}>...</Text>
    content = re.sub(r'<Text\s+style=\{styles\.[^}]*Urdu[^}]*\}[\s>].*?</Text>\n?', '', content, flags=re.DOTALL)

    # 2. Remove redundant <Text className="urdu">...</Text>
    content = re.sub(r'<Text\s+.*className="urdu".*?>.*?</Text>\n?', '', content, flags=re.DOTALL)

    # 3. Replace {lang === 'Urdu' && <Text ...>...</Text>}
    content = re.sub(r'\{lang === \'Urdu\' && <Text[^>]*>([\u0600-\u06FF\s]+)</Text>\}', '', content)

    # 4. Replace manual ternaries that just check language
    # Example: {lang === 'Urdu' ? '????' : 'English'}
    # Actually, those are better replaced manually or left if they are too complex.
    # What about: {profile.language === 'English' ? 'English' : (profile.language === 'Urdu' ? '????' : 'English')}
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        print(f"Cleaned {filepath}")

for root, dirs, files in os.walk('src/screens'):
    for file in files:
        if file.endswith('.jsx'):
            clean_file(os.path.join(root, file))
