from fastapi import APIRouter
from controller.pusnumber_c import want_to_push_number
from controller.chat_c import chat

router = APIRouter()

router.add_api_route("/push-number", endpoint=want_to_push_number, methods=["POST"])
router.add_api_route("/chat", endpoint=chat, methods=["POST"])