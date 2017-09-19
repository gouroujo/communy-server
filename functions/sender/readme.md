DATA=$(printf '{"token":{"id":"59ba8276fed1ce15f2d36ced"},"user":{"email":"pollak.jonathan@gmail.com","fullname":"Jo"},"subject":"reset"}'|base64) && functions-emulator call sender --data '{"data":"'$DATA'"}'

DATA=$(printf '{"token":{"id":"59bfeca515b8f39a1920ef01","organisationId":"59bfec99769c2116bae291f2"},"organisation":{"title":"super orga"},"user":{"email":"pollak.jonathan@gmail.com","fullname":"Jo"},"subject":"invite"}'|base64) && functions-emulator call sender --data '{"data":"'$DATA'"}'
