import { App } from "./src/mod.ts";
import { Suspense } from "preact/compat";

function handlePromiseThrower() {
  const { promise, resolve } = Promise.withResolvers<void>();
  let done = false;
  return {
    throw: function () {
      if (done) return;
      throw promise;
    },
    resolve: function () {
      done = true;
      resolve();
    },
  };
}

const promiseThrower = handlePromiseThrower();

const DelayedComponent = () => {
  promiseThrower.throw();
  return <p>Delayed</p>;
};

export const app = new App()
  .get("/", (ctx) =>
    ctx.renderStream(
      <div>
        <h1>App1</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <DelayedComponent />
        </Suspense>
      </div>,
    ))
  .post("/resolve", (ctx) => {
    promiseThrower.resolve();
    return ctx.json({ message: "Pending Promise resolved" });
  });

await app.listen();
