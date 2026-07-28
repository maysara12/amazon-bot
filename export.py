import json
import csv

with open("response.txt", "r", encoding="utf-8") as file:
    json_data = json.load(file)

drivers = json_data["data"]["resultList"]

with open("drivers.csv", "w", newline="", encoding="utf-8-sig") as file:
    writer = csv.writer(file)

    writer.writerow([
        "Name",
        "Email",
        "Provider ID",
        "Status",
        "Progress"
    ])

    for da in drivers:
        writer.writerow([
            da.get("fullName"),
            da.get("emailAddress"),
            da.get("providerId"),
            da.get("operationalStatus"),
            da.get("assignmentStatusRate")
        ])

print("✅ تم إنشاء ملف drivers.csv")