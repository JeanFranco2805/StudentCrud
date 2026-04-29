from fastapi import APIRouter, Depends

from auth import SupabaseUser, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=SupabaseUser)
def read_me(current_user: SupabaseUser = Depends(get_current_user)):
    return current_user
