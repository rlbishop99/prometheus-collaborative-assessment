import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApiError } from '../../src/api/apiError';
import type { DailySummaries } from '../../src/domain/types';
import { useSymbolSearch } from '../../src/hooks/useSymbolSearch';
import { SessionCache } from '../../src/state/sessionCache';
import { clientMock, nvdaSummaries, tslaSummaries } from '../support/fixtures';

const setup = (): {
  client: ReturnType<typeof clientMock>;
  result: { current: ReturnType<typeof useSymbolSearch> };
  unmount: () => void;
} => {
  const client = clientMock();
  const cache = new SessionCache({ maxEntries: 10 });
  const { result, unmount } = renderHook(() => useSymbolSearch({ client, cache }));
  return { client, result, unmount };
};

/** A promise the test settles by hand, to control request timing. */
const deferred = (): {
  promise: Promise<DailySummaries>;
  resolve: (value: DailySummaries) => void;
} => {
  let resolve!: (value: DailySummaries) => void;
  const promise = new Promise<DailySummaries>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('useSymbolSearch', () => {
  it('loads and then succeeds with the normalized symbol', async () => {
    const { client, result } = setup();
    const gate = deferred();
    client.fetchDailySummaries.mockReturnValueOnce(gate.promise);

    act(() => {
      result.current.search('  tsla ');
    });
    expect(result.current.state).toMatchObject({ status: 'loading', symbol: 'TSLA' });

    await act(async () => {
      gate.resolve(tslaSummaries);
      await gate.promise;
    });
    expect(result.current.state).toMatchObject({
      status: 'success',
      data: { symbol: 'TSLA', summaries: tslaSummaries },
    });
    expect(client.fetchDailySummaries).toHaveBeenCalledWith('TSLA', expect.any(AbortSignal));
  });

  it.each([
    ['', 'emptyInput'],
    ['bad symbol!', 'malformedInput'],
  ] as const)('rejects %j as %s without a request', (input, kind) => {
    const { client, result } = setup();

    act(() => {
      result.current.search(input);
    });

    expect(result.current.state).toEqual({ status: 'error', failure: { kind } });
    expect(client.fetchDailySummaries).not.toHaveBeenCalled();
  });

  it("asks the API on every search, showing the symbol's earlier data meanwhile", async () => {
    const { client, result } = setup();
    const gate = deferred();
    client.fetchDailySummaries
      .mockResolvedValueOnce(nvdaSummaries)
      .mockReturnValueOnce(gate.promise);
    act(() => {
      result.current.search('TSLA');
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    act(() => {
      result.current.search('tsla');
    });
    expect(result.current.state).toMatchObject({
      status: 'loading',
      previous: { symbol: 'TSLA', summaries: nvdaSummaries },
    });

    await act(async () => {
      gate.resolve(tslaSummaries);
      await gate.promise;
    });
    expect(result.current.state).toMatchObject({
      status: 'success',
      data: { summaries: tslaSummaries },
    });
    expect(client.fetchDailySummaries).toHaveBeenCalledTimes(2);
  });

  it('keeps the last good data for the same symbol when the API becomes unreachable', async () => {
    const { client, result } = setup();
    client.fetchDailySummaries
      .mockResolvedValueOnce(tslaSummaries)
      .mockRejectedValueOnce(new ApiError('unreachable', 'down'));

    act(() => {
      result.current.search('TSLA');
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });
    act(() => {
      result.current.search('TSLA');
    });

    await waitFor(() => {
      expect(result.current.state).toMatchObject({
        status: 'error',
        failure: { kind: 'unreachable', symbol: 'TSLA' },
        retained: { symbol: 'TSLA', summaries: tslaSummaries },
      });
    });
  });

  it("never shows another symbol's data while loading or under an outage", async () => {
    const { client, result } = setup();
    client.fetchDailySummaries
      .mockResolvedValueOnce(tslaSummaries)
      .mockRejectedValueOnce(new ApiError('unreachable', 'down'));

    act(() => {
      result.current.search('TSLA');
    });
    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });
    act(() => {
      result.current.search('NVDA');
    });
    expect(result.current.state).toEqual({ status: 'loading', requestId: 2, symbol: 'NVDA' });

    await waitFor(() => {
      expect(result.current.state).toMatchObject({ status: 'error', retained: undefined });
    });
  });

  it('does not retain data for an unknown symbol', async () => {
    const { client, result } = setup();
    client.fetchDailySummaries.mockRejectedValueOnce(new ApiError('notFound', 'nope'));

    act(() => {
      result.current.search('ZZZZ');
    });

    await waitFor(() => {
      expect(result.current.state).toMatchObject({
        status: 'error',
        failure: { kind: 'notFound', symbol: 'ZZZZ' },
        retained: undefined,
      });
    });
  });

  it('cancels a superseded request and ignores its late response', async () => {
    const { client, result } = setup();
    const slowTsla = deferred();
    const signals: AbortSignal[] = [];
    client.fetchDailySummaries.mockImplementation((symbol, signal) => {
      if (signal) signals.push(signal);
      return symbol === 'TSLA' ? slowTsla.promise : Promise.resolve(nvdaSummaries);
    });

    act(() => {
      result.current.search('TSLA');
    });
    act(() => {
      result.current.search('NVDA');
    });
    await waitFor(() => {
      expect(result.current.state).toMatchObject({ status: 'success', data: { symbol: 'NVDA' } });
    });
    await act(async () => {
      slowTsla.resolve(tslaSummaries);
      await slowTsla.promise;
    });

    expect(signals[0]?.aborted).toBe(true);
    expect(result.current.state).toMatchObject({ data: { symbol: 'NVDA' } });
  });

  it('ignores a repeat search for the symbol already loading, until it settles', async () => {
    const { client, result } = setup();
    const gate = deferred();
    client.fetchDailySummaries.mockReturnValueOnce(gate.promise).mockResolvedValue(tslaSummaries);

    let accepted: boolean | undefined;
    act(() => {
      result.current.search('TSLA');
    });
    act(() => {
      accepted = result.current.search(' tsla ');
    });
    expect(accepted).toBe(false);
    expect(client.fetchDailySummaries).toHaveBeenCalledTimes(1);

    await act(async () => {
      gate.resolve(tslaSummaries);
      await gate.promise;
    });
    act(() => {
      accepted = result.current.search('TSLA');
    });
    expect(accepted).toBe(true);
    expect(client.fetchDailySummaries).toHaveBeenCalledTimes(2);
  });

  it('cancels the running search when the next input is rejected', () => {
    const { client, result } = setup();
    let captured: AbortSignal | undefined;
    client.fetchDailySummaries.mockImplementation((_symbol, signal) => {
      captured = signal;
      return deferred().promise;
    });

    act(() => {
      result.current.search('TSLA');
    });
    act(() => {
      result.current.search('bad symbol!');
    });

    expect(captured?.aborted).toBe(true);
    expect(result.current.state).toEqual({ status: 'error', failure: { kind: 'malformedInput' } });
  });

  it('aborts the in-flight request on unmount', () => {
    const { client, result, unmount } = setup();
    let captured: AbortSignal | undefined;
    client.fetchDailySummaries.mockImplementation((_symbol, signal) => {
      captured = signal;
      return deferred().promise;
    });

    act(() => {
      result.current.search('TSLA');
    });
    unmount();

    expect(captured?.aborted).toBe(true);
  });
});
