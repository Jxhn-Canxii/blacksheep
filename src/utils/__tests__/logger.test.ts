// Feature: black-sheep-completion
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { apiGet, apiPost } from '../logger';

vi.mock('axios');
const mockedAxios = axios as typeof axios & { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('apiGet', () => {
  it('returns response data', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ status: 200, data: ['a', 'b'] });
    const result = await apiGet<string[]>('/api/test');
    expect(result).toEqual(['a', 'b']);
  });

  it('logs [api] before and after the call with correct fields', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ status: 200, data: [] });
    await apiGet('/api/test', { params: { foo: 'bar' } });

    const logMock = console.log as ReturnType<typeof vi.fn>;
    expect(logMock).toHaveBeenCalledTimes(2);

    const [preTag, preObj] = logMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(preTag).toBe('[api]');
    expect(preObj).toMatchObject({ method: 'GET', url: '/api/test' });
    expect(typeof preObj.timestamp).toBe('string');

    const [postTag, postObj] = logMock.mock.calls[1] as [string, Record<string, unknown>];
    expect(postTag).toBe('[api]');
    expect(postObj).toMatchObject({ method: 'GET', url: '/api/test', status: 200 });
    expect(typeof postObj.durationMs).toBe('number');
    expect(typeof postObj.timestamp).toBe('string');
  });

  it('logs [api:error] to console.error when axios throws', async () => {
    const axiosError = Object.assign(new Error('Network Error'), { isAxiosError: true, response: { status: 500 } });
    mockedAxios.get = vi.fn().mockRejectedValue(axiosError);
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    await expect(apiGet('/api/fail')).rejects.toThrow();

    const errorMock = console.error as ReturnType<typeof vi.fn>;
    expect(errorMock).toHaveBeenCalledTimes(1);
    const [errTag, errObj] = errorMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(errTag).toBe('[api:error]');
    expect(errObj).toMatchObject({ method: 'GET', url: '/api/fail', status: 500 });
    expect(typeof errObj.durationMs).toBe('number');
    expect(typeof errObj.timestamp).toBe('string');
  });
});

describe('apiPost', () => {
  it('returns response data', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ status: 201, data: { ok: true } });
    const result = await apiPost<{ ok: boolean }>('/api/follows', { follower_id: '1', following_id: '2' });
    expect(result).toEqual({ ok: true });
  });

  it('logs [api] before and after the call with correct fields', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ status: 201, data: {} });
    await apiPost('/api/follows', { follower_id: '1', following_id: '2' });

    const logMock = console.log as ReturnType<typeof vi.fn>;
    expect(logMock).toHaveBeenCalledTimes(2);

    const [preTag, preObj] = logMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(preTag).toBe('[api]');
    expect(preObj).toMatchObject({ method: 'POST', url: '/api/follows' });
    expect(typeof preObj.timestamp).toBe('string');

    const [postTag, postObj] = logMock.mock.calls[1] as [string, Record<string, unknown>];
    expect(postTag).toBe('[api]');
    expect(postObj).toMatchObject({ method: 'POST', url: '/api/follows', status: 201 });
    expect(typeof postObj.durationMs).toBe('number');
    expect(typeof postObj.timestamp).toBe('string');
  });
});
