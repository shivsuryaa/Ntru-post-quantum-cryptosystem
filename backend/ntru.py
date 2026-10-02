import sympy as sp

x = sp.Symbol("x")


def poly_from_coeff(coeff):
    n = len(coeff)

    return sp.Poly(
        sum(
            c * x ** (n - i - 1)
            for i, c in enumerate(coeff)
        ),
        x
    )


def input_to_poly(coeff, n):

    if len(coeff) > n:
        raise ValueError(
            f"Maximum {n} coefficients are allowed."
        )

    coeff = [0] * (n - len(coeff)) + coeff

    return poly_from_coeff(coeff)


def coeff_list(poly, n, mod=None, centered=False):

    expr = (
        poly.as_expr()
        if isinstance(poly, sp.Poly)
        else poly
    )

    poly = sp.Poly(
        sp.rem(
            expr,
            x**n - 1,
            domain=sp.ZZ
        ),
        x
    )

    coeff = [0] * n

    for (degree,), value in poly.terms():

        value = int(value)

        if mod is not None:

            value %= mod

            if centered and value > mod // 2:
                value -= mod

        coeff[n - 1 - degree] = value

    return coeff


def poly_mod(poly, n, mod):

    return poly_from_coeff(
        coeff_list(poly, n, mod)
    )


def center_lift(poly, n, mod):

    return poly_from_coeff(
        coeff_list(
            poly,
            n,
            mod,
            centered=True
        )
    )


def generate_keys(n, p, q, f_coeff, g_coeff):

    f = input_to_poly(f_coeff, n)
    g = input_to_poly(g_coeff, n)

    try:

        fp = poly_mod(
            sp.invert(
                f.as_expr(),
                x**n - 1,
                domain=sp.GF(p)
            ),
            n,
            p
        )

        fq = poly_mod(
            sp.invert(
                f.as_expr(),
                x**n - 1,
                domain=sp.GF(q)
            ),
            n,
            q
        )

    except sp.polys.polyerrors.NotInvertible:

        raise ValueError(
            "Polynomial f is not invertible. "
            "Choose a different f."
        )

    h = poly_mod(
        p * fq.as_expr() * g.as_expr(),
        n,
        q
    )

    return {
        "f": coeff_list(f, n),
        "fp": coeff_list(fp, n),
        "fq": coeff_list(fq, n),
        "h": coeff_list(h, n)
    }


def encrypt(n, q, h_coeff, r_coeff, m_coeff):

    h = input_to_poly(h_coeff, n)
    r = input_to_poly(r_coeff, n)
    m = input_to_poly(m_coeff, n)

    e = poly_mod(
        r.as_expr() * h.as_expr()
        + m.as_expr(),
        n,
        q
    )

    return coeff_list(e, n)


def decrypt(n, p, q, f_coeff, fp_coeff, e_coeff):

    f = input_to_poly(f_coeff, n)
    fp = input_to_poly(fp_coeff, n)
    e = input_to_poly(e_coeff, n)

    a = center_lift(
        f.as_expr() * e.as_expr(),
        n,
        q
    )

    b = poly_mod(
        a,
        n,
        p
    )

    c = poly_mod(
        b.as_expr() * fp.as_expr(),
        n,
        p
    )

    return coeff_list(c, n, p)