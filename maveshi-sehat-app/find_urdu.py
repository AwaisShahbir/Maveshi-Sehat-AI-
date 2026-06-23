import os
import re

for root, dirs, files in os.walk('src/screens'):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            for i, line in enumerate(lines):
                if re.search(r'[\u0600-\u06FF]', line):
                    print(f'{filepath}:{i+1}: {line.strip()}')
