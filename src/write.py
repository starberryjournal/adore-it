from appwrite.client import Client
from appwrite.services.database import Database

client = Client()
client.set_endpoint("https://cloud.appwrite.io/v1").set_project("67bc93bc0004228cf938").set_key("WriteKey")
database = Database(client)

def fetch_image_embeddings():
    documents = database.list_documents(collection_id="67be4e9e001142383751")
    image_embeddings = [{"id": doc['$id'], "embedding": doc['features']} for doc in documents['documents']]
    return image_embeddings
