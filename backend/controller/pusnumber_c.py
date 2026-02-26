from service.pusnumber_s import push_number

async def want_to_push_number():
    answer = await push_number(1, 2)
    return {"number": answer}
    