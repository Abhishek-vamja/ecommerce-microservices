from fastapi.responses import JSONResponse

def error_response():
    return JSONResponse(
        status_code=500,
        content={"message": "Something went wrong, please try again later :)"},
    )