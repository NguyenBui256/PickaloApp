import httpx
import logging
from typing import Any

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Service for sending push notifications using Expo Push Service.
    """
    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

    @classmethod
    async def send_push_notification(
        cls, 
        expo_push_token: str, 
        title: str, 
        body: str, 
        data: dict[str, Any] | None = None
    ) -> bool:
        """
        Send a push notification to a specific device using Expo Push Token.
        """
        if not expo_push_token or not expo_push_token.startswith("ExponentPushToken"):
            logger.warning(f"Invalid Expo Push Token: {expo_push_token}")
            return False

        payload = {
            "to": expo_push_token,
            "title": title,
            "body": body,
            "sound": "default",
        }
        if data:
            payload["data"] = data

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    cls.EXPO_PUSH_URL,
                    json=payload,
                    headers={"Accept": "application/json", "Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    logger.info(f"Notification sent successfully to {expo_push_token}")
                    return True
                else:
                    logger.error(f"Failed to send notification to Expo: {response.text}")
                    return False
            except Exception as e:
                logger.error(f"Error sending push notification: {str(e)}")
                return False

notification_service = NotificationService()
