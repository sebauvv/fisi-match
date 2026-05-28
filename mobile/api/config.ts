const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

export { API_BASE };

export function authHeaders(token: string) {
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`,
	};
}
