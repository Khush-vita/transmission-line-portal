// ======================================================
// TRANSMISSION LINE PERFORMANCE CALCULATOR
// ======================================================


// ======================================================
// COMPLEX NUMBER FUNCTIONS
// ======================================================

function complex(real, imag) {
    return {
        real: real,
        imag: imag
    };
}

function complexAdd(a, b) {
    return complex(
        a.real + b.real,
        a.imag + b.imag
    );
}

function complexSub(a, b) {
    return complex(
        a.real - b.real,
        a.imag - b.imag
    );
}

function complexMul(a, b) {
    return complex(
        a.real * b.real - a.imag * b.imag,
        a.real * b.imag + a.imag * b.real
    );
}

function complexDiv(a, b) {

    const denominator = b.real * b.real + b.imag * b.imag;

    return complex(
        (a.real * b.real + a.imag * b.imag) / denominator,
        (a.imag * b.real - a.real * b.imag) / denominator
    );
}

function complexSqrt(z) {

    const magnitude = Math.sqrt(
        z.real * z.real + z.imag * z.imag
    );

    const realPart = Math.sqrt(
        (magnitude + z.real) / 2
    );

    let imagPart = Math.sqrt(
        (magnitude - z.real) / 2
    );

    if (z.imag < 0) {
        imagPart = -imagPart;
    }

    return complex(realPart, imagPart);
}

function complexCosh(z) {

    return complex(
        Math.cosh(z.real) * Math.cos(z.imag),
        Math.sinh(z.real) * Math.sin(z.imag)
    );
}

function complexSinh(z) {

    return complex(
        Math.sinh(z.real) * Math.cos(z.imag),
        Math.cosh(z.real) * Math.sin(z.imag)
    );
}

function complexMagnitude(z) {

    return Math.sqrt(
        z.real * z.real + z.imag * z.imag
    );
}

function complexAngle(z) {

    return Math.atan2(z.imag, z.real);
}


// ======================================================
// FORMAT COMPLEX NUMBER
// ======================================================

function formatComplex(z, unit = "") {

    const real = z.real.toFixed(4);
    const imag = Math.abs(z.imag).toFixed(4);

    let sign = z.imag >= 0 ? "+" : "-";

    return `${real} ${sign} j${imag} ${unit}`;
}


// ======================================================
// MAIN CALCULATION
// ======================================================

function calculateTransmissionLine() {

    // --------------------------------------------------
    // GET INPUT VALUES
    // --------------------------------------------------

    const L = parseFloat(document.getElementById("length").value);

    const zReal = parseFloat(document.getElementById("zReal").value);
    const zImag = parseFloat(document.getElementById("zImag").value);

    const yReal = parseFloat(document.getElementById("yReal").value);
    const yImag = parseFloat(document.getElementById("yImag").value);

    const PR = parseFloat(document.getElementById("power").value);

    const VR_kV = parseFloat(document.getElementById("voltage").value);

    const pf = parseFloat(document.getElementById("powerFactor").value);

    const pfType = document.getElementById("pfType").value;


    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    const errorMessage = document.getElementById("errorMessage");

    errorMessage.innerText = "";

    if (
        isNaN(L) ||
        isNaN(zReal) ||
        isNaN(zImag) ||
        isNaN(yReal) ||
        isNaN(yImag) ||
        isNaN(PR) ||
        isNaN(VR_kV) ||
        isNaN(pf)
    ) {

        errorMessage.innerText =
            "Please enter valid values in all fields.";

        return;
    }

    if (L <= 0) {
        errorMessage.innerText =
            "Line length must be greater than zero.";

        return;
    }

    if (VR_kV <= 0) {
        errorMessage.innerText =
            "Receiving-end voltage must be greater than zero.";

        return;
    }

    if (PR < 0) {
        errorMessage.innerText =
            "Receiving-end power cannot be negative.";

        return;
    }

    if (pf <= 0 || pf > 1) {
        errorMessage.innerText =
            "Power factor must be between 0 and 1.";

        return;
    }


    // ==================================================
    // LINE CLASSIFICATION
    // ==================================================

    let lineType;
    let modelUsed;

    if (L < 80) {

        lineType = "SHORT TRANSMISSION LINE";
        modelUsed = "Short-Line Model";

    }
    else if (L <= 250) {

        lineType = "MEDIUM TRANSMISSION LINE";
        modelUsed = "Nominal-π Model";

    }
    else {

        lineType = "LONG TRANSMISSION LINE";
        modelUsed = "Exact Distributed Parameter Model";
    }


    document.getElementById("lineType").innerText = lineType;

    document.getElementById("modelUsed").innerText =
        "Model Used: " + modelUsed;

        updateTransmissionDiagram(lineType);

    // ==================================================
    // TOTAL SERIES IMPEDANCE
    // ==================================================

    // Z is given per km

    const Z_per_km = complex(zReal, zImag);

    // Total series impedance

    const Z_total = complex(
        zReal * L,
        zImag * L
    );


    // ==================================================
// TOTAL SHUNT ADMITTANCE
// ==================================================

// Y is given in mho/km
// Therefore total shunt admittance = y × L

const Y_total = complex(
    yReal * L,
    yImag * L
);

document.getElementById("diagramZ").innerText =
    formatComplex(Z_total, "Ω");

document.getElementById("diagramY").innerText =
    formatComplex(Y_total, "mho");

    // ==================================================
    // ABCD PARAMETERS
    // ==================================================

    let A;
    let B;
    let C;
    let D;


    // --------------------------------------------------
    // SHORT LINE
    // --------------------------------------------------

    if (L < 80) {

        A = complex(1, 0);

        B = Z_total;

        C = complex(0, 0);

        D = complex(1, 0);
    }

// --------------------------------------------------
// MEDIUM LINE - NOMINAL PI
// --------------------------------------------------

else if (L <= 250) {

    // A = D = 1 + YZ/2

    const YZ = complexMul(
        Y_total,
        Z_total
    );

    const YZ_over_2 = complex(
        YZ.real / 2,
        YZ.imag / 2
    );

    A = complexAdd(
        complex(1, 0),
        YZ_over_2
    );

    D = A;


    // B = Z

    B = Z_total;


    // C = Y(1 + YZ/4)

    const YZ_over_4 = complex(
        YZ.real / 4,
        YZ.imag / 4
    );

    const onePlusYZ4 = complexAdd(
        complex(1, 0),
        YZ_over_4
    );

    C = complexMul(
        Y_total,
        onePlusYZ4
    );
}
    
    // --------------------------------------------------
    // LONG LINE
    // --------------------------------------------------

    else {

        const y_per_km = complex(
    yReal,
    yImag
);


        // gamma = sqrt(z*y)

        const zy = complexMul(
            Z_per_km,
            y_per_km
        );

        const gamma = complexSqrt(zy);


        // gamma * L

        const gammaL = complex(
            gamma.real * L,
            gamma.imag * L
        );


        // Characteristic impedance

        // Zc = sqrt(z/y)

        const zDivY = complexDiv(
            Z_per_km,
            y_per_km
        );

        const Zc = complexSqrt(zDivY);


        // cosh(gamma L)

        A = complexCosh(gammaL);

        D = A;


        // sinh(gamma L)

        const sinhGammaL =
            complexSinh(gammaL);


        // B = Zc sinh(gamma L)

        B = complexMul(
            Zc,
            sinhGammaL
        );


        // C = sinh(gamma L)/Zc

        C = complexDiv(
            sinhGammaL,
            Zc
        );
    }


    // ==================================================
    // DISPLAY ABCD PARAMETERS
    // ==================================================

    document.getElementById("resultA").innerText =
        formatComplex(A);

    document.getElementById("resultB").innerText =
        formatComplex(B, "Ω");

    document.getElementById("resultC").innerText =
        formatComplex(C, "mho");

    document.getElementById("resultD").innerText =
        formatComplex(D);


    // ==================================================
    // RECEIVING END CURRENT
    // ==================================================

    // Three phase power:
    //
    // P = √3 VL IL pf

    const IR_magnitude =
        (1000 * PR) /
        (Math.sqrt(3) * VR_kV * pf);


    // Power factor angle

    const phiR =
        Math.acos(pf);


    // Leading or lagging

    let currentAngle;

    if (pfType === "lagging") {

        currentAngle = -phiR;

    }
    else {

        currentAngle = phiR;
    }


    const IR = complex(
        IR_magnitude * Math.cos(currentAngle),
        IR_magnitude * Math.sin(currentAngle)
    );


    // Receiving-end phase voltage

    const VR_phase =
        (VR_kV * 1000) / Math.sqrt(3);


    const VR_complex =
        complex(VR_phase, 0);


    // ==================================================
    // SENDING END VOLTAGE
    // ==================================================

    // Vs = A Vr + B Ir

    const AVR =
        complexMul(A, VR_complex);

    const BIR =
        complexMul(B, IR);

    const VS_phase =
        complexAdd(AVR, BIR);


    // Sending line voltage

    const VS_line =
        complexMagnitude(VS_phase) *
        Math.sqrt(3);


    const VS_kV =
        VS_line / 1000;


    // ==================================================
    // SENDING END CURRENT
    // ==================================================

    // Is = C Vr + D Ir

    const CVR =
        complexMul(C, VR_complex);

    const DIR =
        complexMul(D, IR);

    const IS =
        complexAdd(CVR, DIR);


    const IS_magnitude =
        complexMagnitude(IS);


    // ==================================================
    // SENDING END POWER
    // ==================================================

    // S = √3 Vs Is*

    // Complex conjugate of Is

    const IS_conjugate =
        complex(
            IS.real,
            -IS.imag
        );


    const SS =
        complexMul(
            VS_phase,
            IS_conjugate
        );


    const SS_3phase =
        complex(
            SS.real * 3,
            SS.imag * 3
        );


    const PS =
        SS_3phase.real / 1e6;

    const QS =
        SS_3phase.imag / 1e6;


    // Sending apparent power

    const SS_magnitude =
        Math.sqrt(
            PS * PS +
            QS * QS
        );


    // Sending power factor

    const pfS =
        Math.abs(PS) / SS_magnitude;


    // ==================================================
    // VOLTAGE REGULATION
    // ==================================================

    // No-load receiving voltage:
    //
    // Vs = A Vr0
    //
    // Vr0 = Vs / A

    const VR_noLoad =
        complexDiv(
            VS_phase,
            A
        );


    const VR_noLoad_line =
        complexMagnitude(VR_noLoad) *
        Math.sqrt(3);


    const VR_noLoad_kV =
        VR_noLoad_line / 1000;


    const voltageRegulation =
        (
            (VR_noLoad_kV - VR_kV) /
            VR_kV
        ) * 100;


    // ==================================================
    // TRANSMISSION EFFICIENCY
    // ==================================================

    const efficiency =
        (PR / PS) * 100;


    // ==================================================
    // DISPLAY RESULTS
    // ==================================================

    document.getElementById("resultIr").innerText =
        IR_magnitude.toFixed(4) + " A";


    document.getElementById("resultPhiR").innerText =
        (phiR * 180 / Math.PI).toFixed(4) +
        "° " +
        pfType;


    document.getElementById("resultVs").innerText =
        VS_kV.toFixed(4) + " kV";


    document.getElementById("resultIs").innerText =
        IS_magnitude.toFixed(4) + " A";


    document.getElementById("resultPs").innerText =
        PS.toFixed(4) + " MW";


    document.getElementById("resultQs").innerText =
        QS.toFixed(4) + " MVAr";


    document.getElementById("resultPfS").innerText =
        pfS.toFixed(4);


    document.getElementById("voltageRegulation").innerText =
        voltageRegulation.toFixed(4) + " %";


    document.getElementById("efficiency").innerText =
        efficiency.toFixed(4) + " %";


    // ==================================================
    // SHOW RESULT SECTIONS
    // ==================================================

    document.getElementById("classificationSection")
        .style.display = "block";

    document.getElementById("abcdSection")
        .style.display = "block";

    document.getElementById("receivingSection")
        .style.display = "block";

    document.getElementById("sendingSection")
        .style.display = "block";

    document.getElementById("performanceSection")
        .style.display = "block";
}


// ======================================================
// RESET
// ======================================================

function resetCalculator() {

    location.reload();
}

// ======================================================
// TRANSMISSION LINE DIAGRAM
// ======================================================

function updateTransmissionDiagram(lineType) {

    const diagramSection =
        document.getElementById("diagramSection");

    const diagramTitle =
        document.getElementById("diagramTitle");

    const svg =
        document.getElementById("transmissionDiagram");


    // Show diagram section

    diagramSection.style.display = "block";


    // Clear previous diagram

    svg.innerHTML = "";


    // --------------------------------------------------
    // SHORT TRANSMISSION LINE
    // --------------------------------------------------

    if (lineType.includes("SHORT")) {

        diagramTitle.innerText =
            "Short Transmission Line Model";


        svg.innerHTML = `

            <!-- Main line -->

            <line
                x1="100"
                y1="150"
                x2="800"
                y2="150"
                stroke="#3035c9"
                stroke-width="4"
            />

            <!-- Sending end -->

            <circle
                cx="100"
                cy="150"
                r="7"
                fill="#3035c9"
            />

            <text
                x="75"
                y="125"
                font-size="18"
                font-weight="bold"
            >
                Vs
            </text>


            <!-- Impedance -->

            <rect
                x="390"
                y="125"
                width="120"
                height="50"
                fill="white"
                stroke="#3035c9"
                stroke-width="3"
            />

            <text
                x="450"
                y="157"
                text-anchor="middle"
                font-size="18"
                font-weight="bold"
            >
                Z
            </text>


            <!-- Receiving end -->

            <circle
                cx="800"
                cy="150"
                r="7"
                fill="#3035c9"
            />

            <text
                x="810"
                y="125"
                font-size="18"
                font-weight="bold"
            >
                Vr
            </text>


            <!-- Current arrows -->

            <text
                x="180"
                y="135"
                font-size="16"
            >
                Is →
            </text>

            <text
                x="690"
                y="135"
                font-size="16"
            >
                Ir →
            </text>

        `;
    }


    // --------------------------------------------------
    // MEDIUM TRANSMISSION LINE
    // NOMINAL PI MODEL
    // --------------------------------------------------

    else if (lineType.includes("MEDIUM")) {

        diagramTitle.innerText =
            "Medium Transmission Line – Nominal-π Model";


        svg.innerHTML = `

            <!-- Main conductor -->

            <line
                x1="100"
                y1="130"
                x2="800"
                y2="130"
                stroke="#3035c9"
                stroke-width="4"
            />


            <!-- Z -->

            <rect
                x="390"
                y="105"
                width="120"
                height="50"
                fill="white"
                stroke="#3035c9"
                stroke-width="3"
            />

            <text
                x="450"
                y="137"
                text-anchor="middle"
                font-size="18"
                font-weight="bold"
            >
                Z
            </text>


            <!-- Left Y/2 -->

            <line
                x1="250"
                y1="130"
                x2="250"
                y2="210"
                stroke="#3035c9"
                stroke-width="3"
            />

            <line
                x1="220"
                y1="210"
                x2="280"
                y2="210"
                stroke="#3035c9"
                stroke-width="3"
            />

            <text
                x="250"
                y="195"
                text-anchor="middle"
                font-size="17"
                font-weight="bold"
            >
                Y/2
            </text>


            <!-- Right Y/2 -->

            <line
                x1="650"
                y1="130"
                x2="650"
                y2="210"
                stroke="#3035c9"
                stroke-width="3"
            />

            <line
                x1="620"
                y1="210"
                x2="680"
                y2="210"
                stroke="#3035c9"
                stroke-width="3"
            />

            <text
                x="650"
                y="195"
                text-anchor="middle"
                font-size="17"
                font-weight="bold"
            >
                Y/2
            </text>


            <!-- Sending end -->

            <circle
                cx="100"
                cy="130"
                r="7"
                fill="#3035c9"
            />

            <text
                x="70"
                y="100"
                font-size="18"
                font-weight="bold"
            >
                Vs
            </text>


            <!-- Receiving end -->

            <circle
                cx="800"
                cy="130"
                r="7"
                fill="#3035c9"
            />

            <text
                x="810"
                y="100"
                font-size="18"
                font-weight="bold"
            >
                Vr
            </text>


            <!-- Current -->

            <text
                x="155"
                y="115"
                font-size="16"
            >
                Is →
            </text>

            <text
                x="710"
                y="115"
                font-size="16"
            >
                Ir →
            </text>


            <!-- Ground -->

            <text
                x="250"
                y="245"
                text-anchor="middle"
                font-size="15"
            >
                Ground
            </text>

            <text
                x="650"
                y="245"
                text-anchor="middle"
                font-size="15"
            >
                Ground
            </text>

        `;
    }


    // --------------------------------------------------
    // LONG TRANSMISSION LINE
    // --------------------------------------------------

    else {

        diagramTitle.innerText =
            "Long Transmission Line – Distributed Parameter Model";


        svg.innerHTML = `

            <!-- Main line -->

            <line
                x1="100"
                y1="150"
                x2="800"
                y2="150"
                stroke="#3035c9"
                stroke-width="4"
            />


            <!-- Distributed parameters -->

            <line
                x1="230"
                y1="150"
                x2="230"
                y2="210"
                stroke="#3035c9"
                stroke-width="3"
            />

            <line
                x1="220"
                y1="210"
                x2="240"
                y2="210"
                stroke="#3035c9"
                stroke-width="3"
            />


            <line
                x1="450"
                y1="150"
                x2="450"
                y2="210"
                stroke="#3035c9"
                stroke-width="3"
            />

            <line
                x1="440"
                y1="210"
                x2="460"
                y2="210"
                stroke="#3035c9"
                stroke-width="3"
            />


            <line
                x1="670"
                y1="150"
                x2="670"
                y2="210"
                stroke="#3035c9"
                stroke-width="3"
            />

            <line
                x1="660"
                y1="210"
                x2="680"
                y2="210"
                stroke="#3035c9"
                stroke-width="3"
            />


            <!-- Labels -->

            <text
                x="230"
                y="195"
                text-anchor="middle"
                font-size="15"
            >
                Distributed Y
            </text>

            <text
                x="450"
                y="195"
                text-anchor="middle"
                font-size="15"
            >
                Distributed Y
            </text>

            <text
                x="670"
                y="195"
                text-anchor="middle"
                font-size="15"
            >
                Distributed Y
            </text>


            <!-- Sending -->

            <circle
                cx="100"
                cy="150"
                r="7"
                fill="#3035c9"
            />

            <text
                x="70"
                y="125"
                font-size="18"
                font-weight="bold"
            >
                Vs
            </text>


            <!-- Receiving -->

            <circle
                cx="800"
                cy="150"
                r="7"
                fill="#3035c9"
            />

            <text
                x="810"
                y="125"
                font-size="18"
                font-weight="bold"
            >
                Vr
            </text>


            <!-- Current -->

            <text
                x="150"
                y="135"
                font-size="16"
            >
                Is →
            </text>

            <text
                x="710"
                y="135"
                font-size="16"
            >
                Ir →
            </text>

        `;
    }
}
