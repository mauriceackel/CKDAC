import React, { ReactElement } from 'react';

function Home(): ReactElement {
  return (
    <div className="content-page flex flex-col items-center">
      <h1 className="mt-4 text-xl">
        GABBLE - An application-layer tool that allows iot devices to
        communicate automatically
      </h1>

      <p className="mt-8 px-2 md:w">
        GABBLE is a composed word that is related to IoT, symbiotic bonds
        (biology) and Bots (software). Embedded devices are connected to the
        world wide web by using internet protocols. So called Internet-of-Things
        (IoT) devices already create value. Application examples include
        monitoring capabilities or predictive maintenance scenarios. However,
        even more value is hidden when multiple IoT devices are composed with
        open interfaces that chat can be access by third-parties. Hence, GABBLE
        breaks down IoT application silos to enable symbiotic bonds between open
        IoT devices. In the short-term, the tool supports software engineers to
        generate software adapters easily. In the long-term, the tool can work
        without human intervention by automating the generation process
        completely - just like a bot. This is mainly achieved by using reasoning
        principles (e.g. transitive relations) from logical artificial
        intelligence. Hence, GABBLE takes over repetitive software adapter
        implementation tasks such that software engineers can focus on the
        important stuff.
      </p>
    </div>
  );
}

export default Home;
