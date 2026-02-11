
# import boto3



# settings = get_settings()
# settings.BUCKET_NAME = settings.BUCKET_NAME


# s3 = boto3.client(
#     "s3",
#     region_name="us-east-1",  
#     aws_access_key_id=settings.AWS_ACCESS_KEY,
#     aws_secret_access_key=settings.AWS_SECRET_KEY,
# )


# def creat_signed_url():


#     try:
#         presigned_url = s3.generate_presigned_url(
#         ClientMethod="get_object",
#         Params={
#             "Bucket": settings.BUCKET_NAME,
#             "Key": extract_s3_key(profile_url)
#         },
#         ExpiresIn=3600  # seconds = 1 hour

    
#         )

#         logger.info(f"Presigned url created succesfully for user profile {profile_url}")

#         #set a new cookie with this 

#         token_obj = Token(user_id)

#         new_jwt = token_obj.createAccessTokenWithUserId()

#         logger.info("new presigned url successfully generated: ", new_jwt)


        
#         return {'success' : True, "presigned_url": presigned_url, "jwt" : new_jwt}
    
#     except Exception as e:
        