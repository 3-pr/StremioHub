import json
import os
import urllib.request

def download_avatars():
    base_url = "https://dpyhjjcoabcglfmgecug.supabase.co/storage/v1/object/public/avatars/"
    
    with open('avatars.json', 'r') as f:
        avatars = json.load(f)
    
    target_dirs = [
        "extension/assets/avatars",
        "extension-firefox/assets/avatars"
    ]
    
    for d in target_dirs:
        os.makedirs(d, exist_ok=True)
    
    for av in avatars:
        filename = av['storage_path']
        url = base_url + filename
        print(f"Downloading {filename}...")
        try:
            temp_path = f"extension/assets/avatars/{filename}"
            urllib.request.urlretrieve(url, temp_path)
            
            # Copy to firefox
            with open(temp_path, 'rb') as f_in:
                with open(f"extension-firefox/assets/avatars/{filename}", 'wb') as f_out:
                    f_out.write(f_in.read())
                    
        except Exception as e:
            print(f"Failed to download {filename}: {e}")

if __name__ == "__main__":
    download_avatars()
