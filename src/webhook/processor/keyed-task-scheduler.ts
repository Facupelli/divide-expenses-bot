export class KeyedTaskScheduler<Key> {
	private readonly tails = new Map<Key, Promise<unknown>>();

	get activeKeyCount(): number {
		return this.tails.size;
	}

	run<Result>(key: Key, task: () => Promise<Result>): Promise<Result> {
		const previous = this.tails.get(key) ?? Promise.resolve();
		const current = previous.catch(() => undefined).then(task);

		this.tails.set(key, current);
		const cleanup = () => {
			if (this.tails.get(key) === current) {
				this.tails.delete(key);
			}
		};
		void current.then(cleanup, cleanup);

		return current;
	}
}
