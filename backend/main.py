from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ntru import generate_keys, encrypt, decrypt


app = FastAPI(
    title="NTRU Cryptosystem API",
    version="1.0.0"
)


# ------------------------------------
# CORS
# ------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://Nth-degree.vercel.app"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------
# REQUEST MODELS
# ------------------------------------

class KeyRequest(BaseModel):
    n: int
    p: int
    q: int
    f: list[int]
    g: list[int]


class EncryptRequest(BaseModel):
    n: int
    q: int
    h: list[int]
    r: list[int]
    message: list[int]


class DecryptRequest(BaseModel):
    n: int
    p: int
    q: int
    f: list[int]
    fp: list[int]
    encrypted: list[int]


# ------------------------------------
# HOME
# ------------------------------------

@app.get("/")
def home():

    return {
        "message": "NTRU Cryptosystem API",
        "status": "running"
    }


# ------------------------------------
# HEALTH
# ------------------------------------

@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


# ------------------------------------
# KEY GENERATION
# ------------------------------------

@app.post("/generate-keys")
def create_keys(data: KeyRequest):

    try:

        result = generate_keys(
            data.n,
            data.p,
            data.q,
            data.f,
            data.g
        )

        return {
            "success": True,
            "keys": result
        }

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# ------------------------------------
# ENCRYPT
# ------------------------------------

@app.post("/encrypt")
def encrypt_message(data: EncryptRequest):

    try:

        encrypted = encrypt(
            data.n,
            data.q,
            data.h,
            data.r,
            data.message
        )

        return {
            "success": True,
            "encrypted": encrypted
        }

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# ------------------------------------
# DECRYPT
# ------------------------------------

@app.post("/decrypt")
def decrypt_message(data: DecryptRequest):

    try:

        decrypted = decrypt(
            data.n,
            data.p,
            data.q,
            data.f,
            data.fp,
            data.encrypted
        )

        return {
            "success": True,
            "decrypted": decrypted
        }

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )