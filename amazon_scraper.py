import requests
import csv
import time

URL = "https://logistics.amazon.co.uk/account-management/data/search-providers"

HEADERS = {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json",
    "origin": "https://logistics.amazon.co.uk",
    "referer": "https://logistics.amazon.co.uk/account-management/delivery-associates?providerType=DA&searchStart=0&searchSize=100",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36",
    "x-amz-rid": "WX14K9G32MTS94YNKXFH"
}

COOKIES = {
    "ubid-acbuk": "260-3957446-8695232",
    "session-id": "257-1632456-7262035",
    "x-acbuk": "awWWEmg18ruMe7S6PPTrET?umBtVe2OKwtRSTIcFUELBJntj9?YtYkF?@3dG3ze?",
    "at-acbuk": "Atza|gQDsSiM6AwEBAqSTphVZtOgqR6QfPiHkhQPjZlRAxsBCkkbNUyLji93NEN10CetzP8CRXOqHj9aBSIRslRbxlhFXhIigDpH2OSMSVm0zDD85bp5_hNjgtUKoY3ykV_x9Ven9-I8fHXCMYaMPXUM6mGz7RmAz1m3tJa3LxbsqItKkdqghszYxjqobgc0JmJChxCCY7UG-ResLo3j-epjM2dwbRAXl8VwGC_Ci9mwJoVtBHIpcivvouP7RJ2o8YbsfEAK1Rv87Cni1_61aLfzozTNmI11qDgKKxuv0eedkXF2oNNu9fCA-2BFW3cWnJ6LJ3HJb831DmZXhRgiAxebYs0yGQM_qc-Yw4hAJPCe_hC99grZYch5BozDHt_ON-mqpG6gEaRIg17iG6Wb5J7ycxFiViQInBMCEUK1qDhjuX-mz2-g",
    "sess-at-acbuk": "b1hN1+cK3c7UW6LF8wkXWnD6NxSE4uw+vy0vSj6wRwQ=",
    "session-token": "IMVYcgZCcW1yi62QqV9Ee0B830S+VrLnFbf7YtamEoppb/E/1vL9AJJdg/VwI8DDp86vNKHAd6Ib9lpqnJ0zrUiKPOzd+NNSQpsXe9J0jni7g5bmzVS0B8O9RRR9P1IfaJeHIqkfMNbx1wHQuzOD9Fty4i+8rO7MfDrg6a1TOlD88I9uljG2YbrXpHlPFeqAzUjmslOa/Tg6iaN1ojACbnPeEQuRfEni2w6720ww/dLsPlFRrmTlj4u1w9x73+98LBlw2BS+2mE="
}


all_drivers = []

start = 0
size = 100

while True:
    print(f"جاري سحب الصفحة من {start} ...")

    payload = {
        "providerType": "DA",
        "searchStart": start,
        "searchSize": size
    }

    r = requests.post(
        URL,
        json=payload,
        headers=HEADERS,
        cookies=COOKIES
    )

    data = r.json()

    drivers = data["data"]["resultList"]

    if not drivers:
        break

    all_drivers.extend(drivers)

    if len(drivers) < size:
        break

    start += size
    time.sleep(1)


print("إجمالي الـ DAs:", len(all_drivers))


with open("drivers.csv", "w", newline="", encoding="utf-8-sig") as file:
    writer = csv.writer(file)

    writer.writerow([
        "Name",
        "Email",
        "Provider ID",
        "Phone",
        "Status",
        "Progress"
    ])

    for d in all_drivers:
        writer.writerow([
            d.get("fullName"),
            d.get("emailAddress"),
            d.get("providerId"),
            d.get("phoneNumber"),
            d.get("operationalStatus"),
            d.get("assignmentStatusRate")
        ])


print("✅ تم تحديث drivers.csv")