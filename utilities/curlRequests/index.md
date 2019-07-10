# cURL Request Boilerplates
## Please note that some fields must be modified to your specifications.

#### "Get Started" Button

    curl -X POST -H "Content-Type: application/json" -d '{
    "setting_type":"call_to_actions",
    "thread_state":"new_thread",
    "call_to_actions":[
        {
            "payload":"Home"
        }
    ]
    }' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=PAGE_ACCESS_TOKEN"