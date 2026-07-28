import requests

print("انا شغال على النسخة الجديدة")

import gspread
from google.oauth2.service_account import Credentials

url = "https://logistics.amazon.eg/account-management/data/search-providers"

cookies = {
    "ubid-acbeg": "260-7207635-8701523",
    "x-acbeg": "vAPvPyyKS8wDfWEyoKE0DBwbHbpV3K6lxNgHLDW5bSkAkXP@qLSdNUxZx7ur@LG6",
    "sst-acbeg": "Sst1|PQKCHty9VHXjNhAGj7XVj7h_DdXpfmPJFHsNQeC4rDsguAgWux2dhJSN886rCBK3_9AdUNJdlftjfCqdh8STR-Aulyq6Fv9V-MVnjVFn9vbIBK142fWKElBizemRucS1lxIYZGJAdB3Q-0y-UzT0vpgqw9zy6v802MXxL0jHcNnDRlQ_vQ22bh8ZN__uQk2hTuScnCfuFiBke9fRgKrpS5P4sg0PgBZjiS5MSiPYFsd0IefttRrvByzg8OqpKZeeq_tqzW3r5X2UhwMtF491cLJbrt7tOA-6k3n21l4dA4Na66Dh2t9mRjST2vt8wc0uaa0D7TwvNPKUD4aIoyx7oR6rLpqUgq0xR-3cesV1OrXeg6oQwD3UEPE0j1wroyMqvIVc",
  "at-acbeg": "Atza|gQBgS0wAAwEBAEfDCGm0kHEohglilSDmLoB9zQBAnJgLOGSX7CEsy9o3SxpGavyI7TXBdevWv4FLy_4JguACUcK_YfQAL8vjwQf3JNQS1xVPgREvuIZBjGtme4cVYBouSZmKIpsv0GykKV0_UVQEvg4aEZ-SookvLrJ-h37AQ-U9xXTaBtf-b_HaJqracH8cly2eBP2ngFHE8JB5kIYFDV7ZAfM4ewQDuYIatdiqL4FWYEPNChCDpb7dBY_T-jloVLkJUMAPoMhRNQ2H0CgJ64guypEo9-r6KGyFJKKMUf618-TEmIs9RV-al02hRNBbAtqns7mIYJJGDvAQ-YuXFlIME4VAtU2wuia0doJzYYlLzDWUBj8DZMCpUxKskanKyLW55mBSbnO5w4V1Zt3fbVSo88vc8gQOv_MRqfsTHENizjVyrw",
    "sess-at-acbeg": "2qtpoPL0555Ql7CxkorN6hec7mPTEtyU7E1LF56Lf/s=",
    "session-id": "260-3609681-5346234",
    "lc-acbeg": "en_EG",
    "session-token": "uyPMoNqzeESDE27pkTAiAx9swmu+83/x4L9FJOxO0VGQt2I1PhXyNqx3MEp5iTq+tTTGkAzIwU6SFGYWGfV4S0UDsifYMy+mj973qeMvi6tO199R7gLlIB++WgnUbAiX183jClirUDphC40pDXfRYtYhXjjoYHbuDoaf9JTfH7U4H9QmgG1pawX1AJZilAdM4+niu+2KEjpzMtBS3GrsHK4rjYl4Y8SC80nvgWekP3DqsrC3n1J4ubo8lo8RG63F"
}
headers = {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36",
    "x-requested-with": "XMLHttpRequest",
    "origin": "https://logistics.amazon.eg",
    "referer": "https://logistics.amazon.eg/account-management/delivery-associates?providerType=DA&searchStart=0&searchSize=100"
}


all_drivers = []

for start in range(0, 1000, 100):

    payload = {
        "providerType": "DA",
        "searchStart": start,
        "searchSize": 100
    }

    response = requests.post(
        url,
        headers=headers,
        cookies=cookies,
        json=payload
    )

    print("Status Code:", response.status_code)

    try:
        data = response.json()
    except:
        print("أمازون رجعت رد غير JSON")
        break

    if not data.get("success"):
        print("أمازون رفضت الطلب")
        break

    drivers_page = data["data"]["resultList"]

    if len(drivers_page) == 0:
        break

    all_drivers.extend(drivers_page)

    print(f"تم سحب صفحة تبدأ من {start} - عددها {len(drivers_page)}")


drivers = all_drivers


print("إجمالي عدد المندوبين:", len(drivers))

for driver in drivers[:5]:
    print("--------------------")
    print("الاسم:", driver["fullName"])
    print("الإيميل:", driver["emailAddress"])
    print("الحالة:", driver["operationalStatus"])


print("عدد الداتا المسحوبة:", len(drivers))

for d in drivers[:3]:
    print(d)


# الاتصال بـ Google Sheets
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

creds = Credentials.from_service_account_file(
    "amazon-api-503717-8d3c37701d16.json",
    scopes=SCOPES
)

client = gspread.authorize(creds)

spreadsheet = client.open_by_key(
    "1lbw5trSPOaJJ37lmkXeZEI_GtnA3DcOjmT1jSFsyavo"
)

sheet = spreadsheet.worksheet("Amazon DAs")

print("Connected Successfully!")

# ترتيب الحالات:
# ACTIVE الأول
# ONBOARDING بعده
# OFFBOARDED في الآخر

status_order = {
    "ACTIVE": 1,
    "ONBOARDING": 2,
    "OFFBOARDED": 3
}

drivers_sorted = sorted(
    drivers,
    key=lambda x: status_order.get(x.get("operationalStatus", ""), 99)
)


rows = []

for driver in drivers_sorted:
    rows.append([
        driver.get("fullName", ""),
        driver.get("emailAddress", ""),
        driver.get("operationalStatus", "")
    ])

print("عدد الصفوف قبل الرفع:", len(rows))


# إضافة الهيدر
final_data = [
    ["Name", "Email", "Status"]
] + rows


# تحديث الشيت مرة واحدة
sheet.clear()

sheet.update(
    range_name=f"A1:C{len(final_data)}",
    values=final_data
)

def update_amazon_sheet():
    # كل كود السحب والتحديث هنا
    return "Done"