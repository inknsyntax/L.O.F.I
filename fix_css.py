with open('css/style.css', 'rb') as f:
    content = f.read()

# Filter out null bytes (0x00)
clean_content = content.replace(b'\x00', b'')

with open('css/style.css', 'wb') as f:
    f.write(clean_content)

print("Fixed css/style.css")