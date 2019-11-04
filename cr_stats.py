#!/usr/bin/env python3

import requests
import sys
import json
import pymongo

TOKEN = "ya29.Gl0mB_fzF7I-whikkyBsogpk1GlAEfqRjfW4Ol-EgLjpo07kZG_Wxevjz1WB6U5DnQNmKKcqGuJ5U9MrMZ1T7g2ocH9JVaI-Bytl21WAtsDZwUDBPGgw0SKhMFOBIQw"

def connect_to_mongod():
    return pymongo.MongoClient("mongodb+srv://charlie:zuhro4-xuVqor-merjyn@edgemere-47slw.mongodb.net/codereview?retryWrites=true&w=majority")

def search(token, **params):
    endpoint = "https://mongodbcr.appspot.com/search"
    r = requests.get(endpoint, params=params, headers=dict(Authorization="OAuth " + token))
    assert(r.status_code == 200)
    return r.json()

def copy_new_reviews(mongo_client, token):
    params = {"format": "json", "created_after": "2018-01-01"}

    response = search(token, **params)
    mongo_client.codereview.issues.insert_many(response["results"])
    cursor_id = response["cursor"]
    while (cursor_id != ""): 
        params["cursor"] = cursor_id
        response = search(token, **params)
        cursor_id = response["cursor"]
        if len(response["results"]) > 0:
            mongo_client.codereview.issues.insert_many(response["results"])

def get_details(client, token):
    updates = []
    i = 0
    for issue in client.codereview.issues.find({"issue": {"$nin": [195420001, 255050001,
        438200007]}, "patch_details": {"$exists": False}}).sort([("modified", pymongo.ASCENDING)]):
        print(issue["issue"])
        details = []
        for patch_set in issue["patchsets"]:
            params = {"comments": True, "format": "json"}
            r = requests.get("https://mongodbcr.appspot.com/api/" + str(issue["issue"]) + "/" + str(patch_set), params=params, headers=dict(Authorization="OAuth " + token))
            print(r.status_code)
            if (r.status_code == 404):
                # The patch set was probably deleted somehow?
                print("Skipping patch set with a 404")
                continue
            if (r.status_code == 500):
                # Not sure what's going on here...
                print("Skipping patch set with a 500")
                continue
            if (r.status_code != 200):
                print(r.text)
                exit(1)
            details.append(r.json())
        i += 1
        updates.append(pymongo.UpdateOne({"issue": issue["issue"]}, {"$set": {"patch_details": details}}))
        if (i % 100 == 0):
            client.codereview.issues.bulk_write(updates)
            updates = []
    if len(updates) > 0:
        client.codereview.issues.bulk_write(updates)

def get_messages(client, token):
    updates = []
    i = 0
    for issue in client.codereview.issues.find({"messages": {"$exists": False}}).sort([("modified", pymongo.DESCENDING)]):
        print(issue["issue"])
        params = {"messages": True, "format": "json"}
        r = requests.get("https://mongodbcr.appspot.com/api/" + str(issue["issue"]), params=params, headers=dict(Authorization="OAuth " + token))
        print(r.status_code)
        if (r.status_code == 404):
            # The patch set was probably deleted somehow?
            print("Skipping patch set with a 404")
            continue
        if (r.status_code != 200):
            print(r.text)
            exit(1)
        updates.append(pymongo.UpdateOne({"_id": issue["_id"]}, {"$set": {"messages": r.json()["messages"]}}))
        i += 1
        if (i % 1000 == 0):
            client.codereview.issues.bulk_write(updates)
            updates = []
    if len(updates) > 0:
        client.codereview.issues.bulk_write(updates)


def main():
    mongo_client = connect_to_mongod()
    token = sys.argv[1] if len(sys.argv) > 1 else TOKEN
    if (0):
        print("copying reviews")
        copy_new_reviews(mongo_client, token)
    print("populating messages")
    get_messages(mongo_client, token)
    print("populating patch details")
    get_details(mongo_client, token)
    print("done!")


if __name__ == "__main__":
    main()
