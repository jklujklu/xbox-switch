(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? (module.exports = factory())
        : typeof define === "function" && define.amd
            ? define(factory)
            : ((global =
                typeof globalThis !== "undefined" ? globalThis : global || self),
                (global.GameController = factory()));
})(this, function () {
        "use strict";

        function noop() {
        }

        function add_location(element, file, line, column, char) {
            element.__svelte_meta = {
                loc: {file, line, column, char}
            };
        }

        function run(fn) {
            return fn();
        }

        function blank_object() {
            return Object.create(null);
        }

        function run_all(fns) {
            fns.forEach(run);
        }

        function is_function(thing) {
            return typeof thing === "function";
        }

        function safe_not_equal(a, b) {
            return a != a
                ? b == b
                : a !== b ||
                (a && typeof a === "object") ||
                typeof a === "function";
        }

        function is_empty(obj) {
            return Object.keys(obj).length === 0;
        }

        function append(target, node) {
            target.appendChild(node);
        }

        function insert(target, node, anchor) {
            target.insertBefore(node, anchor || null);
        }

        function detach(node) {
            node.parentNode.removeChild(node);
        }

        function element(name) {
            return document.createElement(name);
        }

        function text(data) {
            return document.createTextNode(data);
        }

        function space() {
            return text(" ");
        }

        function listen(node, event, handler, options) {
            node.addEventListener(event, handler, options);
            return () => node.removeEventListener(event, handler, options);
        }

        function attr(node, attribute, value) {
            if (value == null) node.removeAttribute(attribute);
            else if (node.getAttribute(attribute) !== value)
                node.setAttribute(attribute, value);
        }

        function children(element) {
            return Array.from(element.childNodes);
        }

        function set_style(node, key, value, important) {
            node.style.setProperty(key, value, important ? "important" : "");
        }

        function toggle_class(element, name, toggle) {
            element.classList[toggle ? "add" : "remove"](name);
        }

        function custom_event(type, detail) {
            const e = document.createEvent("CustomEvent");
            e.initCustomEvent(type, false, false, detail);
            return e;
        }

        let current_component;

        function set_current_component(component) {
            current_component = component;
        }

        const dirty_components = [];
        const binding_callbacks = [];
        const render_callbacks = [];
        const flush_callbacks = [];
        const resolved_promise = Promise.resolve();
        let update_scheduled = false;

        function schedule_update() {
            if (!update_scheduled) {
                update_scheduled = true;
                resolved_promise.then(flush);
            }
        }

        function add_render_callback(fn) {
            render_callbacks.push(fn);
        }

        let flushing = false;
        const seen_callbacks = new Set();

        function flush() {
            if (flushing) return;
            flushing = true;
            do {
                // first, call beforeUpdate functions
                // and update components
                for (let i = 0; i < dirty_components.length; i += 1) {
                    const component = dirty_components[i];
                    set_current_component(component);
                    update(component.$$);
                }
                dirty_components.length = 0;
                while (binding_callbacks.length) binding_callbacks.pop()();
                // then, once components are updated, call
                // afterUpdate functions. This may cause
                // subsequent updates...
                for (let i = 0; i < render_callbacks.length; i += 1) {
                    const callback = render_callbacks[i];
                    if (!seen_callbacks.has(callback)) {
                        // ...so guard against infinite loops
                        seen_callbacks.add(callback);
                        callback();
                    }
                }
                render_callbacks.length = 0;
            } while (dirty_components.length);
            while (flush_callbacks.length) {
                flush_callbacks.pop()();
            }
            update_scheduled = false;
            flushing = false;
            seen_callbacks.clear();
        }

        function update($$) {
            if ($$.fragment !== null) {
                $$.update();
                run_all($$.before_update);
                const dirty = $$.dirty;
                $$.dirty = [-1];
                $$.fragment && $$.fragment.p($$.ctx, dirty);
                $$.after_update.forEach(add_render_callback);
            }
        }

        const outroing = new Set();

        function transition_in(block, local) {
            if (block && block.i) {
                outroing.delete(block);
                block.i(local);
            }
        }

        function mount_component(component, target, anchor) {
            const {fragment, on_mount, on_destroy, after_update} = component.$$;
            fragment && fragment.m(target, anchor);
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                } else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
            after_update.forEach(add_render_callback);
        }

        function destroy_component(component, detaching) {
            const $$ = component.$$;
            if ($$.fragment !== null) {
                run_all($$.on_destroy);
                $$.fragment && $$.fragment.d(detaching);
                $$.on_destroy = $$.fragment = null;
                $$.ctx = [];
            }
        }

        function make_dirty(component, i) {
            if (component.$$.dirty[0] === -1) {
                dirty_components.push(component);
                schedule_update();
                component.$$.dirty.fill(0);
            }
            component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
        }

        let buttonPress = {
            a: 0,
            b: 0,
            x: 0,
            y: 0,
            lb: 0,
            rb: 0,
            lt: 0,
            rt: 0,
            map: 0,
            menu: 0,
            lstick: 0,
            rstick: 0,
            up: 0,
            down: 0,
            left: 0,
            right: 0,
            xbox: 0
        };
        let preAxis = {lx: 0, ly: 0, rx: 0, ry: 0};


        function compareAxes(one, two) {
            return Math.abs(one['lx'] - two['lx']) + Math.abs(one['ly'] - two['ly']) +
                Math.abs(one['ry'] - two['ry']) + Math.abs(one['rx'] - two['rx']) > 0.1
        }


        function init(
            component,
            options,
            instance,
            create_fragment,
            not_equal,
            props,
            dirty = [-1]
        ) {
            const parent_component = current_component;
            set_current_component(component);
            const prop_values = options.props || {};
            const $$ = (component.$$ = {
                fragment: null,
                ctx: null,
                // state
                props,
                update: noop,
                not_equal,
                bound: blank_object(),
                // lifecycle
                on_mount: [],
                on_destroy: [],
                before_update: [],
                after_update: [],
                context: new Map(
                    parent_component ? parent_component.$$.context : []
                ),
                // everything else
                callbacks: blank_object(),
                dirty,
                skip_bound: false
            });
            let ready = false;
            $$.ctx = instance
                ? instance(component, prop_values, (i, ret, ...rest) => {
                        const value = rest.length ? rest[0] : ret;
                        if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
                            if (i === 0) {
                                for (let btn in value) {
                                    if (value[btn] === 1) {
                                        if (!buttonPress[btn]) {
                                            console.log(`${btn} pressed`)
                                            ws.send(JSON.stringify({mode: 'click', function: 'hold', params: {key: btn}}));
                                        }
                                        buttonPress[btn] = 1;
                                    } else if (value[btn] === 0) {
                                        if (buttonPress[btn]) {
                                            console.log(`${btn} release`)
                                            ws.send(JSON.stringify({
                                                mode: 'click',
                                                function: 'release',
                                                params: {key: btn}
                                            }));
                                        }
                                        buttonPress[btn] = 0;
                                    }
                                }
                            } else if (i === 7) {
                                // console.log(value)
                                ws.send(JSON.stringify({
                                    mode: 'stick',
                                    function: '',
                                    params: {lx: value.lx, ly: value.ly, rx: value.rx, ry: value.ry}
                                }));
                                // ws.send(`stick_${value.lx}/${value.ly}/${value.rx}/${value.ry}`)
                            }
                            if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
                            if (ready) make_dirty(component, i);
                        }
                        return ret;
                    }
                )
                :
                [];
            $$.update();
            ready = true;
            run_all($$.before_update);
            // `false` as a special case of no DOM component
            $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
            if (options.target) {
                if (options.hydrate) {
                    const nodes = children(options.target);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    $$.fragment && $$.fragment.l(nodes);
                    nodes.forEach(detach);
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    $$.fragment && $$.fragment.c();
                }
                if (options.intro) transition_in(component.$$.fragment);
                mount_component(component, options.target, options.anchor);
                flush();
            }
            set_current_component(parent_component);
        }

        class SvelteComponent {
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }

            $on(type, callback) {
                const callbacks =
                    this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1) callbacks.splice(index, 1);
                };
            }

            $set($$props) {
                if (this.$$set && !is_empty($$props)) {
                    this.$$.skip_bound = true;
                    this.$$set($$props);
                    this.$$.skip_bound = false;
                }
            }
        }

        function dispatch_dev(type, detail) {
            document.dispatchEvent(
                custom_event(type, Object.assign({version: "3.24.1"}, detail))
            );
        }

        function append_dev(target, node) {
            dispatch_dev("SvelteDOMInsert", {target, node});
            append(target, node);
        }

        function insert_dev(target, node, anchor) {
            dispatch_dev("SvelteDOMInsert", {target, node, anchor});
            insert(target, node, anchor);
        }

        function detach_dev(node) {
            dispatch_dev("SvelteDOMRemove", {node});
            detach(node);
        }

        function listen_dev(
            node,
            event,
            handler,
            options,
            has_prevent_default,
            has_stop_propagation
        ) {
            const modifiers =
                options === true
                    ? ["capture"]
                    : options
                        ? Array.from(Object.keys(options))
                        : [];
            if (has_prevent_default) modifiers.push("preventDefault");
            if (has_stop_propagation) modifiers.push("stopPropagation");
            dispatch_dev("SvelteDOMAddEventListener", {
                node,
                event,
                handler,
                modifiers
            });
            const dispose = listen(node, event, handler, options);
            return () => {
                dispatch_dev("SvelteDOMRemoveEventListener", {
                    node,
                    event,
                    handler,
                    modifiers
                });
                dispose();
            };
        }

        function attr_dev(node, attribute, value) {
            attr(node, attribute, value);
            if (value == null)
                dispatch_dev("SvelteDOMRemoveAttribute", {node, attribute});
            else dispatch_dev("SvelteDOMSetAttribute", {node, attribute, value});
        }

        function validate_slots(name, slot, keys) {
            for (const slot_key of Object.keys(slot)) {
                if (!~keys.indexOf(slot_key)) {
                    console.warn(
                        `<${name}> received an unexpected slot "${slot_key}".`
                    );
                }
            }
        }

        class SvelteComponentDev extends SvelteComponent {
            constructor(options) {
                if (!options || (!options.target && !options.$$inline)) {
                    throw new Error(`'target' is a required option`);
                }
                super();
            }

            $destroy() {
                super.$destroy();
                this.$destroy = () => {
                    console.warn(`Component was already destroyed`); // eslint-disable-line no-console
                };
            }

            $capture_state() {
            }

            $inject_state() {
            }
        }

        /* src/Controller.svelte generated by Svelte v3.24.1 */

        const file = "src/Controller.svelte";

        function create_fragment(ctx) {
            let section;
            let div0;
            let t0;
            let div2;
            let div1;
            let t1;
            let div4;
            let div3;
            let t2;
            let button0;
            let t3;
            let button1;
            let t4;
            let button2;
            let t5;
            let button3;
            let t6;
            let button4;
            let t7;
            let button5;
            let t8;
            let button6;
            let t9;
            let button7;
            let t10;
            let button8;
            let t11;
            let button9;
            let t12;
            let button10;
            let t13;
            let button11;
            let t14;
            let button12;
            let t15;
            let button13;
            let button13_style_value;
            let t16;
            let button14;
            let button14_style_value;
            let mounted;
            let dispose;

            const block = {
                c: function create() {
                    section = element("section");
                    div0 = element("div");
                    t0 = space();
                    div2 = element("div");
                    div1 = element("div");
                    t1 = space();
                    div4 = element("div");
                    div3 = element("div");
                    t2 = space();
                    button0 = element("button");
                    t3 = space();
                    button1 = element("button");
                    t4 = space();
                    button2 = element("button");
                    t5 = space();
                    button3 = element("button");
                    t6 = space();
                    button4 = element("button");
                    t7 = space();
                    button5 = element("button");
                    t8 = space();
                    button6 = element("button");
                    t9 = space();
                    button7 = element("button");
                    t10 = space();
                    button8 = element("button");
                    t11 = space();
                    button9 = element("button");
                    t12 = space();
                    button10 = element("button");
                    t13 = space();
                    button11 = element("button");
                    t14 = space();
                    button12 = element("button");
                    t15 = space();
                    button13 = element("button");
                    t16 = space();
                    button14 = element("button");
                    attr_dev(div0, "class", "pad svelte-1xis06h");
                    add_location(div0, file, 94, 1, 1831);
                    attr_dev(div1, "class", "stick svelte-1xis06h");
                    set_style(div1, "transform", /*stickl*/ ctx[1]());
                    toggle_class(div1, "click", /*buttonMap*/ ctx[0].lstick);
                    add_location(div1, file, 96, 2, 1882);
                    attr_dev(div2, "class", "well left svelte-1xis06h");
                    add_location(div2, file, 95, 1, 1856);
                    attr_dev(div3, "class", "stick svelte-1xis06h");
                    set_style(div3, "transform", /*stickr*/ ctx[2]());
                    toggle_class(div3, "click", /*buttonMap*/ ctx[0].rstick);
                    add_location(div3, file, 99, 2, 2006);
                    attr_dev(div4, "class", "well right svelte-1xis06h");
                    add_location(div4, file, 98, 1, 1979);
                    attr_dev(button0, "class", "button a svelte-1xis06h");
                    toggle_class(button0, "on", /*buttonMap*/ ctx[0].a);
                    add_location(button0, file, 101, 1, 2103);
                    attr_dev(button1, "class", "button b svelte-1xis06h");
                    toggle_class(button1, "on", /*buttonMap*/ ctx[0].b);
                    add_location(button1, file, 102, 1, 2162);
                    attr_dev(button2, "class", "button x svelte-1xis06h");
                    toggle_class(button2, "on", /*buttonMap*/ ctx[0].x);
                    add_location(button2, file, 103, 1, 2221);
                    attr_dev(button3, "class", "button y svelte-1xis06h");
                    toggle_class(button3, "on", /*buttonMap*/ ctx[0].y);
                    add_location(button3, file, 104, 1, 2280);
                    attr_dev(button4, "class", "button map svelte-1xis06h");
                    toggle_class(button4, "on", /*buttonMap*/ ctx[0].map);
                    add_location(button4, file, 105, 1, 2339);
                    attr_dev(button5, "class", "button menu svelte-1xis06h");
                    toggle_class(button5, "on", /*buttonMap*/ ctx[0].menu);
                    add_location(button5, file, 106, 1, 2402);
                    attr_dev(button6, "class", "button xbox svelte-1xis06h");
                    // toggle_class(button6, "on", /*buttonMap*/ ctx[0].xbox);
                    add_location(button6, file, 107, 1, 2467);
                    attr_dev(button7, "class", "dpad du svelte-1xis06h");
                    toggle_class(button7, "on", /*buttonMap*/ ctx[0].up);
                    add_location(button7, file, 108, 1, 2532);
                    attr_dev(button8, "class", "dpad dr svelte-1xis06h");
                    toggle_class(button8, "on", /*buttonMap*/ ctx[0].right);
                    add_location(button8, file, 109, 1, 2591);
                    attr_dev(button9, "class", "dpad dd svelte-1xis06h");
                    toggle_class(button9, "on", /*buttonMap*/ ctx[0].down);
                    add_location(button9, file, 110, 1, 2650);
                    attr_dev(button10, "class", "dpad dl svelte-1xis06h");
                    toggle_class(button10, "on", /*buttonMap*/ ctx[0].left);
                    add_location(button10, file, 111, 1, 2709);
                    attr_dev(button11, "class", "bumper left svelte-1xis06h");
                    toggle_class(button11, "on", /*buttonMap*/ ctx[0].lb);
                    add_location(button11, file, 112, 1, 2768);
                    attr_dev(button12, "class", "bumper right svelte-1xis06h");
                    toggle_class(button12, "on", /*buttonMap*/ ctx[0].rb);
                    add_location(button12, file, 113, 1, 2831);
                    attr_dev(button13, "class", "trigger left svelte-1xis06h");
                    attr_dev(
                        button13,
                        "style",
                        (button13_style_value = /*trigger*/ ctx[3]("lt"))
                    );
                    add_location(button13, file, 114, 1, 2895);
                    attr_dev(button14, "class", "trigger right svelte-1xis06h");
                    attr_dev(
                        button14,
                        "style",
                        (button14_style_value = /*trigger*/ ctx[3]("rt"))
                    );
                    add_location(button14, file, 115, 1, 2959);
                    attr_dev(section, "class", "controller svelte-1xis06h");
                    add_location(section, file, 93, 0, 1801);
                },
                l: function claim(nodes) {
                    throw new Error(
                        "options.hydrate only works if the component was compiled with the `hydratable: true` option"
                    );
                },
                m: function mount(target, anchor) {
                    insert_dev(target, section, anchor);
                    append_dev(section, div0);
                    append_dev(section, t0);
                    append_dev(section, div2);
                    append_dev(div2, div1);
                    append_dev(section, t1);
                    append_dev(section, div4);
                    append_dev(div4, div3);
                    append_dev(section, t2);
                    append_dev(section, button0);
                    append_dev(section, t3);
                    append_dev(section, button1);
                    append_dev(section, t4);
                    append_dev(section, button2);
                    append_dev(section, t5);
                    append_dev(section, button3);
                    append_dev(section, t6);
                    append_dev(section, button4);
                    append_dev(section, t7);
                    append_dev(section, button5);
                    append_dev(section, t8);
                    append_dev(section, button6);
                    append_dev(section, t9);
                    append_dev(section, button7);
                    append_dev(section, t10);
                    append_dev(section, button8);
                    append_dev(section, t11);
                    append_dev(section, button9);
                    append_dev(section, t12);
                    append_dev(section, button10);
                    append_dev(section, t13);
                    append_dev(section, button11);
                    append_dev(section, t14);
                    append_dev(section, button12);
                    append_dev(section, t15);
                    append_dev(section, button13);
                    append_dev(section, t16);
                    append_dev(section, button14);

                    if (!mounted) {
                        dispose = [
                            listen_dev(
                                window,
                                "gamepadconnected",
                                /*plugIn*/ ctx[4],
                                false,
                                false,
                                false
                            ),
                            listen_dev(
                                window,
                                "gamepaddisconnected",
                                /*unPlug*/ ctx[5],
                                false,
                                false,
                                false
                            )
                        ];

                        mounted = true;
                    }
                },
                p: function update(ctx, [dirty]) {
                    if (dirty & /*stickl*/ 2) {
                        set_style(div1, "transform", /*stickl*/ ctx[1]());
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(div1, "click", /*buttonMap*/ ctx[0].lstick);
                    }

                    if (dirty & /*stickr*/ 4) {
                        set_style(div3, "transform", /*stickr*/ ctx[2]());
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(div3, "click", /*buttonMap*/ ctx[0].rstick);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button0, "on", /*buttonMap*/ ctx[0].a);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button1, "on", /*buttonMap*/ ctx[0].b);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button2, "on", /*buttonMap*/ ctx[0].x);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button3, "on", /*buttonMap*/ ctx[0].y);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button4, "on", /*buttonMap*/ ctx[0].map);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button5, "on", /*buttonMap*/ ctx[0].menu);
                    }

                    // if (dirty & /*buttonMap*/ 1) {
                    //     toggle_class(button6, "on", /*buttonMap*/ ctx[0].xbox);
                    // }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button7, "on", /*buttonMap*/ ctx[0].up);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button8, "on", /*buttonMap*/ ctx[0].right);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button9, "on", /*buttonMap*/ ctx[0].down);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button10, "on", /*buttonMap*/ ctx[0].left);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button11, "on", /*buttonMap*/ ctx[0].lb);
                    }

                    if (dirty & /*buttonMap*/ 1) {
                        toggle_class(button12, "on", /*buttonMap*/ ctx[0].rb);
                    }

                    if (
                        dirty & /*trigger*/ 8 &&
                        button13_style_value !==
                        (button13_style_value = /*trigger*/ ctx[3]("lt"))
                    ) {
                        attr_dev(button13, "style", button13_style_value);
                    }

                    if (
                        dirty & /*trigger*/ 8 &&
                        button14_style_value !==
                        (button14_style_value = /*trigger*/ ctx[3]("rt"))
                    ) {
                        attr_dev(button14, "style", button14_style_value);
                    }
                },
                i: noop,
                o: noop,
                d: function destroy(detaching) {
                    if (detaching) detach_dev(section);
                    mounted = false;
                    run_all(dispose);
                }
            };

            dispatch_dev("SvelteRegisterBlock", {
                block,
                id: create_fragment.name,
                type: "component",
                source: "",
                ctx
            });

            return block;
        }

        function instance($$self, $$props, $$invalidate) {
            let poll;

            let buttonMap = {
                a: 0,
                b: 0,
                x: 0,
                y: 0,
                lb: 0,
                rb: 0,
                lt: 0,
                rt: 0,
                map: 0,
                menu: 0,
                lstick: 0,
                rstick: 0,
                up: 0,
                down: 0,
                left: 0,
                right: 0,
                xbox: 0
            };

            let axisMap = {lx: 0, ly: 0, rx: 0, ry: 0};
            let preAxisMap = {lx: 0, ly: 0, rx: 0, ry: 0};
            const plugIn = () => {
                startController();
            };

            const unPlug = () => {
                cancelAnimationFrame(poll);
            };

            const startController = () => {
                const gamepads = navigator.getGamepads();

                if (!gamepads) {
                    return;
                }

                const pad = gamepads[0];

                const buttons = [
                    "a",
                    "b",
                    "x",
                    "y",
                    "lb",
                    "rb",
                    "lt",
                    "rt",
                    "map",
                    "menu",
                    "lstick",
                    "rstick",
                    "up",
                    "down",
                    "left",
                    "right",
                    "xbox"
                ];

                const axes = ["lx", "ly", "rx", "ry"];

                pad.buttons.forEach((button, i) => {
                    $$invalidate(
                        0,
                        (buttonMap[buttons[i]] = button.pressed ? button.value : 0),
                        buttonMap
                    );
                });

                pad.axes.forEach((axis, i) => {
                    axisMap[axes[i]] = axis > 0.01 || axis < -0.01 ? parseFloat(axis.toFixed(3)) : 0
                    if (compareAxes(preAxisMap, axisMap)) {
                        $$invalidate(
                            7,
                            (axisMap[axes[i]] =
                                axis > 0.01 || axis < -0.01
                                    ? parseFloat(axis.toFixed(3))
                                    : 0),
                            axisMap
                        );
                        preAxis = axisMap;
                    }

                });

                poll = requestAnimationFrame(startController);
            };

            const writable_props = [];

            Object.keys($$props).forEach((key) => {
                if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$")
                    console.warn(
                        `<Controller> was created with unknown prop '${key}'`
                    );
            });

            let {$$slots = {}, $$scope} = $$props;
            validate_slots("Controller", $$slots, []);

            $$self.$capture_state = () => ({
                poll,
                buttonMap,
                axisMap,
                plugIn,
                unPlug,
                startController,
                stickl,
                stickr,
                trigger
            });


            $$self.$inject_state = ($$props) => {
                if ("poll" in $$props) poll = $$props.poll;
                if ("buttonMap" in $$props) $$invalidate(0, (buttonMap = $$props.buttonMap));
                if ("axisMap" in $$props) $$invalidate(7, (axisMap = $$props.axisMap));
                if ("stickl" in $$props) $$invalidate(1, (stickl = $$props.stickl));
                if ("stickr" in $$props) $$invalidate(2, (stickr = $$props.stickr));
                if ("trigger" in $$props)
                    $$invalidate(3, (trigger = $$props.trigger));
            };

            let stickl;
            let stickr;
            let trigger;

            if ($$props && "$$inject" in $$props) {
                $$self.$inject_state($$props.$$inject);
            }

            $$self.$$.update = () => {
                if ($$self.$$.dirty & /*axisMap, buttonMap*/ 129) {
                    $$invalidate(
                        1,
                        (stickl = () => {
                            let x = axisMap.lx * 25;
                            let y = axisMap.ly * 25;
                            let rx = axisMap.lx * 10;
                            let ry = axisMap.ly * 10;
                            let z = 1 - buttonMap.lstick * 0.05;
                            return `translateX(${x}%) translateY(${y}%) rotateY(${rx}deg) rotateX(${ry}deg) scale(${z})`;
                        })
                    );
                }

                if ($$self.$$.dirty & /*axisMap, buttonMap*/ 129) {
                    $$invalidate(
                        2,
                        (stickr = () => {
                            let x = axisMap.rx * 25;
                            let y = axisMap.ry * 25;
                            let rx = axisMap.rx * 10;
                            let ry = axisMap.ry * 10;
                            let z = 1 - buttonMap.rstick * 0.05;
                            return `translateX(${x}%) translateY(${y}%) rotateY(${rx}deg) rotateX(${ry}deg) scale(${z})`;
                        })
                    );
                }

                if ($$self.$$.dirty & /*buttonMap*/ 1) {
                    $$invalidate(
                        3,
                        (trigger = (side) => {
                            let s = buttonMap[side];
                            let sx = side === "rt" ? -s : s;

                            return `
			transform: scaleX(${sx}) scaleY(${s}) rotate(-69deg);
			opacity: ${0.3 + s};
		`;
                        })
                    );
                }
            };

            return [buttonMap, stickl, stickr, trigger, plugIn, unPlug];
        }

        class Controller extends SvelteComponentDev {
            constructor(options) {
                super(options);
                init(this, options, instance, create_fragment, safe_not_equal, {});

                dispatch_dev("SvelteRegisterComponent", {
                    component: this,
                    tagName: "Controller",
                    options,
                    id: create_fragment.name
                });
            }
        }

        return Controller;
    }
)
;