from processors import get_processor
from processors.bucket import BucketProcessor


        # "content_payload": {
        #     "url": url,
        #     "title": title,
        #     "source": source,
        #     "first_saved_at": utc_time.isoformat(),
        # },


    # payload = {
    #     "content_payload": {
    #         "url": url,
    #         "title": title,
    #         "source": source,
    #         "first_saved_at": utc_time.isoformat(),
    #     },
    #     "raw_html": html[0:50],
    #     "user_id": str(user_id),
    #     "notes": notes,
    #     "folder_id": str(folder_id) if folder_id else None,
    # }

test_data = {
    "content_payload" : {
        "url" : "https://huggingface.co/datasets/nvidia/NitroGen",
        "title" : "https://huggingface.co/datasets/nvidia/NitroGen", 
        "source" : "web_app", 
        "first_saved_at" : '2025-12-28 18:51:42.471089-05'
    },
    'raw_html' : None,
    'user_id' : 'fc1ee8c1-fd30-4670-ad22-c4cd4d886807',
    "notes" : '',
    'folder_id' : None, 


}

content_id = '8ed8a17b-53f1-4c86-9f7d-39a60085fe85'


def testBucket():

    bucket_processor : BucketProcessor = get_processor('process_folder')
    status = bucket_processor.process(test_data, content_id)

    if status == True:
        print('sucesfully bucket the item')
    else:
        print("something went wrong")

