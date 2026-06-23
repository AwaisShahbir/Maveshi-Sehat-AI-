import os
import re

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    changed = False

    for line in lines:
        if re.search(r'[\u0600-\u06FF]', line):
            # If the line has Urdu AND has a <Text tag AND does NOT have t(
            if '<Text' in line and 't(' not in line:
                changed = True
                continue # Skip this line, effectively deleting it
        new_lines.append(line)

    if changed:
        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            f.writelines(new_lines)
        print(f"Cleaned {filepath}")

for root, dirs, files in os.walk('src/screens'):
    for file in files:
        if file.endswith('.jsx'):
            clean_file(os.path.join(root, file))
