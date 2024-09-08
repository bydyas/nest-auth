import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "src/user/schemas/user.schema";

export const CurrentUser = createParamDecorator(
  (key: keyof User, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return key ? user[key] : user;
  }
);
