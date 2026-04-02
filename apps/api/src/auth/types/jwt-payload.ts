export type CallerType = 'user' | 'service';

export interface JwtPayload {
    // Subject — Discord user ID for users, ServiceClient.clientId for services
    sub: string;
    // Discriminates between a human user and a machine service client
    type: CallerType;
}
