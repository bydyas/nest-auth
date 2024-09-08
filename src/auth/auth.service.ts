import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dtos/auth.dto';
import { verify } from 'argon2';
import { Types } from 'mongoose';
import { removePassword } from 'src/utils/helpers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  EXPIRE_DAY_REFRESH_TOKEN: number = 1;
  REFRESH_TOKEN_NAME: string = 'refreshToken';
  COOKIE_OPTIONS: CookieOptions;

  constructor(
    private jwt: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {
    this.COOKIE_OPTIONS = {
      httpOnly: true,
      domain: this.configService.get<string>('CLIENT_DOMAIN'),
      expires: new Date(0),
      secure: true,
      sameSite: 'none', // lax for production
    }
  }

  async login(dto: AuthDto) {
    const user = await this.validateUser(dto);
    const tokens = this.issueTokens(user._id);

    return {
      user: removePassword(user),
      ...tokens,
    };
  }

  async register(dto: AuthDto) {
    const candidate = await this.userService.findOneByEmail(dto.email);

    if (candidate) throw new BadRequestException('User already exists');

    const user = await this.userService.create(dto);

    const tokens = this.issueTokens(user._id);

    return {
      user: removePassword(user),
      ...tokens,
    };
  }

  async getNewTokens(refreshToken: string) {
    const result = await this.jwt.verifyAsync(refreshToken);

    if (!result) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findOne(result.id);

    const tokens = this.issueTokens(user._id);

    return {
      user,
      ...tokens,
    }
  }

  private issueTokens(userId: Types.ObjectId) {
    const data = { id: userId };

    const accessToken = this.jwt.sign(data, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwt.sign(data, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async validateUser(dto: AuthDto) {
    const user = await this.userService.findOneByEmail(dto.email);

    if (!user) throw new NotFoundException('User not found');

    const isValid = await verify(user.password, dto.password);

    if (!isValid) throw new UnauthorizedException('Invalid password');

    return user;
  }

  addRefreshTokenToResponse(res: Response, refreshToken: string) {
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN);

    res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
      ...this.COOKIE_OPTIONS,
      expires: expiresIn,
    });
  }

  removeRefreshTokenFromResponse(res: Response) {
    res.cookie(this.REFRESH_TOKEN_NAME, '', this.COOKIE_OPTIONS);
  }
}
